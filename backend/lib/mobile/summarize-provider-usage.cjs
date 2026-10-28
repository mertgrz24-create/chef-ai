// Local-only operational summary. Whitelisted metadata only; never echoes raw log lines.
const fields=['inputTokens','outputTokens','thinkingTokens','cachedTokens','totalTokens']
function summarize(records){
  const attempts=new Map(),groups=new Map();let unattributedEvents=0
  for(const record of records){
    if(record?.event!=='ai_provider_attempt'||!['started','finished'].includes(record.phase))continue
    if(!/^[a-f0-9-]{36}$/i.test(record.jobId??'')||!Number.isSafeInteger(record.attempt)||record.attempt<1){unattributedEvents++;continue}
    const key=record.jobId+':'+record.attempt,entry=attempts.get(key)??{}
    if(record.phase==='started')entry.started=true
    else if(!entry.finished)entry.finished=record
    entry.model=/^gemini-[a-z0-9.-]{1,100}$/.test(record.requestedModel??'')?record.requestedModel:'unknown'
    entry.operation=['recipes','modify','scan','plan','regenerate'].includes(record.operation)?record.operation:'unknown'
    attempts.set(key,entry)
  }
  for(const entry of attempts.values()){
    const key=entry.model+':'+entry.operation
    const group=groups.get(key)??{model:entry.model,operation:entry.operation,observedAttempts:0,started:0,finished:0,errors:0,tokens:Object.fromEntries(fields.map(field=>[field,{knownTotal:null,unknownAttempts:0}])),estimatedCharge:null,billedCharge:null}
    group.observedAttempts++;if(entry.started)group.started++
    if(entry.finished){group.finished++;if(entry.finished.outcome==='error')group.errors++}
    for(const field of fields){const value=entry.finished?.[field];if(typeof value==='number'&&Number.isSafeInteger(value)&&value>=0)group.tokens[field].knownTotal=(group.tokens[field].knownTotal??0)+value;else group.tokens[field].unknownAttempts++}
    groups.set(key,group)
  }
  return {scope:'Observed log events only; not a complete billing ledger',unattributedEvents,groups:[...groups.values()]}
}
module.exports={summarize}
if(require.main===module){
 const run=async()=>{
  if(process.argv.length!==2||process.stdin.isTTY){
   console.error('Provide JSONL on standard input: node lib/mobile/summarize-provider-usage.cjs < metadata.jsonl. File arguments are not accepted.')
   process.exitCode=1
   return
  }
  const lines=require('node:readline').createInterface({input:process.stdin,crlfDelay:Infinity})
  const records=[];let malformedLines=0
  for await(const line of lines){
   if(!line)continue
   try{records.push(JSON.parse(line))}catch{malformedLines++}
  }
  console.log(JSON.stringify({...summarize(records),malformedLines},null,2))
 }
 run().catch(()=>{
  console.error('Unable to summarize standard input.')
  process.exitCode=1
 })
}
