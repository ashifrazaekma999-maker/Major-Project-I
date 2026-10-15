NETRISH BIOMETRIC TEST DATASET

This is a SAFE SYNTHETIC test bundle created only for validating the NETRISH
biometric upload/search UI and backend workflow.

All faces and fingerprints are artificial test patterns.
They are NOT real people, NOT government records, and NOT a criminal database.

Each subject has:
- one enrolled synthetic face
- one probe face
- one enrolled synthetic right-thumb fingerprint
- one probe fingerprint

The CSV maps each enrolled/probe pair with match_label=MATCH.

Suggested test:
1. Import biometric_test_records.csv.
2. Upload a probe image in NETRISH.
3. Verify candidate retrieval.
4. Verify case/entity linking.
5. Verify audit logging.
6. Keep the UI labelled TEST ONLY / SYNTHETIC.

For real biometric research data, use an authorized public research dataset
such as NIST Special Database 301 and follow its terms.
