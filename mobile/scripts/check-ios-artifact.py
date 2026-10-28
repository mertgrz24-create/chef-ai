"""Inspect an actual .app bundle. Signing, device behavior and store review are separate."""
import json
import hashlib
from pathlib import Path
import plistlib
import subprocess


def main():
    root = Path(__file__).resolve().parent.parent
    app = root / 'artifacts/ios-simulator/ChefAI.app'
    output = root / 'security/ios-artifact-latest.json'
    local_environment = root.parent / '.env.local'
    if app.is_symlink() or not app.is_dir():
        raise ValueError('Expected retained simulator app in the project artifact directory')
    info = plistlib.loads((app / 'Info.plist').read_bytes())
    for key in ['NSMicrophoneUsageDescription', 'NSFaceIDUsageDescription',
                'NSLocationWhenInUseUsageDescription', 'NSContactsUsageDescription']:
        if key in info:
            raise ValueError('Unexpected permission declaration: ' + key)
    for key in ['NSCameraUsageDescription', 'NSPhotoLibraryUsageDescription']:
        if not info.get(key):
            raise ValueError('Missing contextual permission explanation: ' + key)
    if info.get('NSAppTransportSecurity', {}).get('NSAllowsArbitraryLoads') is not False:
        raise ValueError('ATS arbitrary loads must be explicitly disabled')
    if int(info.get('DTXcode', 0)) < 2600:
        raise ValueError('Xcode 26+ required')
    if info.get('CFBundleExecutable') != 'ChefAI':
        raise ValueError('Unexpected executable name in project artifact')
    executable = app / 'ChefAI'
    architectures = subprocess.check_output(['xcrun', 'lipo', '-archs', str(executable)], text=True).strip().split()
    if not architectures or 'arm64' not in architectures:
        raise ValueError('Expected compiled arm64 app executable')
    if b'temporary probe; never production route' in (app / 'main.jsbundle').read_bytes():
        raise ValueError('Native test probe must never ship in the normal app bundle')
    manifests = []
    for file in app.rglob('PrivacyInfo.xcprivacy'):
        data = plistlib.loads(file.read_bytes())
        if data.get('NSPrivacyTracking') is True or data.get('NSPrivacyTrackingDomains'):
            raise ValueError('Unexpected tracking declaration in native bundle')
        manifests.append({'file': str(file.relative_to(app)), 'manifest': data})
    if not (app / 'PrivacyInfo.xcprivacy').is_file():
        raise ValueError('Missing aggregated app privacy manifest')
    forbidden = []
    if local_environment.is_file():
        for line in local_environment.read_text().splitlines():
            key, separator, value = line.partition('=')
            if separator and key in {'SUPABASE_SERVICE_ROLE_KEY', 'GEMINI_API_KEY', 'PEXELS_API_KEY', 'CRON_SECRET'}:
                value = value.strip().strip('"').strip("'")
                if value:
                    forbidden.append((key, value.encode()))
    count = 0
    for file in app.rglob('*'):
        if not file.is_file():
            continue
        if not file.resolve().is_relative_to(app.resolve()):
            raise ValueError('Native artifact links outside its bundle')
        count += 1
        if forbidden:
            data = file.read_bytes()
            for key, value in forbidden:
                if value in data:
                    raise ValueError('Forbidden server credential in native artifact: ' + key)
    result = {'bundleIdentifier': info['CFBundleIdentifier'], 'architectures': architectures,
              'executableSha256': hashlib.sha256(executable.read_bytes()).hexdigest(),
              'sdk': info.get('DTSDKName'), 'xcode': info.get('DTXcode'),
              'atsArbitraryLoads': False, 'cameraPhotoDescriptionsPresent': True,
              'unexpectedPermissionDeclarations': [], 'filesChecked': count,
              'nativeProbeMarkerAbsent': True,
              'serverCredentialValuesChecked': len(forbidden), 'serverCredentialMatches': 0,
              'privacyManifests': manifests,
              'scope': 'Actual compiled .app inspection only. No signing, physical device or App Store certification.'}
    output.write_text(json.dumps(result, indent=2) + '\n')
    print(f'iOS artifact checks passed: {count} files, {len(manifests)} privacy manifests, {architectures}')


if __name__ == '__main__':
    main()
