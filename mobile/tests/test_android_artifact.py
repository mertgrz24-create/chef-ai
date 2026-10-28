import importlib.util
from pathlib import Path
import struct
import unittest

spec = importlib.util.spec_from_file_location('artifact', Path(__file__).parent.parent / 'scripts/check-android-artifact.py')
artifact = importlib.util.module_from_spec(spec)
spec.loader.exec_module(artifact)


class AlignmentChecks(unittest.TestCase):
    @staticmethod
    def elf(bits, alignment, segment_type=1):
        data = bytearray(128)
        data[:4] = b'\x7fELF'
        data[4], data[5] = (2 if bits == 64 else 1), 1
        if bits == 64:
            struct.pack_into('<Q', data, 32, 64)
            struct.pack_into('<HH', data, 54, 56, 1)
            struct.pack_into('<IIQQQQQQ', data, 64, segment_type, 0, 0, 0, 0, 0, 0, alignment)
        else:
            struct.pack_into('<I', data, 28, 64)
            struct.pack_into('<HH', data, 42, 32, 1)
            struct.pack_into('<IIIIIIII', data, 64, segment_type, 0, 0, 0, 0, 0, 0, alignment)
        return data

    def test_16kb_and_larger_segments(self):
        for bits in [32, 64]:
            for alignment in [16384, 65536]:
                self.assertEqual(artifact.load_alignments(self.elf(bits, alignment)), [alignment])

    def test_4kb_and_invalid_alignment_rejected(self):
        for bits in [32, 64]:
            for alignment in [4096, 0, 20000]:
                with self.assertRaises(ValueError):
                    artifact.load_alignments(self.elf(bits, alignment))

    def test_missing_load_segments_rejected(self):
        with self.assertRaises(ValueError):
            artifact.load_alignments(self.elf(64, 16384, segment_type=0))

    def test_non_elf_and_truncation_fail_closed(self):
        for value in [b'other', self.elf(64, 16384)[:70]]:
            with self.assertRaises((ValueError, IndexError, struct.error)):
                artifact.load_alignments(value)


if __name__ == '__main__':
    unittest.main()
