export class BiometricSubject {
  constructor({ id, subjectId, caseId, displayName, status = 'TEST_ONLY', metadata = {} }) {
    this.id = id || subjectId;
    this.subjectId = subjectId;
    this.caseId = caseId;
    this.displayName = displayName;
    this.status = status;
    this.metadata = metadata;
    this.isSynthetic = true;
    this.createdAt = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      subjectId: this.subjectId,
      caseId: this.caseId,
      displayName: this.displayName,
      status: this.status,
      isSynthetic: this.isSynthetic,
      metadata: this.metadata,
      createdAt: this.createdAt
    };
  }
}

export class BiometricTemplate {
  constructor({ id, subjectId, biometricType, fingerName = null, imagePath, templatePath = null, source = 'SYNTHETIC_TEST_DATASET', createdAt }) {
    this.id = id || `TPL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.subjectId = subjectId;
    this.biometricType = biometricType; // 'FACE' | 'FINGERPRINT'
    this.fingerName = fingerName; // 'RIGHT_THUMB' | 'LEFT_THUMB' | etc.
    this.imagePath = imagePath;
    this.templatePath = templatePath;
    this.source = source;
    this.isSynthetic = true;
    this.createdAt = createdAt || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      subjectId: this.subjectId,
      biometricType: this.biometricType,
      fingerName: this.fingerName,
      imagePath: this.imagePath,
      templatePath: this.templatePath,
      source: this.source,
      isSynthetic: this.isSynthetic,
      createdAt: this.createdAt
    };
  }
}

export class BiometricSearchRequest {
  constructor({ id, userId, caseId, biometricType, inputFile, status = 'PENDING', fingerName = null, originalFilename = '', mimeType = '', fileSize = 0 }) {
    this.id = id || `REQ-BIO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.userId = userId;
    this.caseId = caseId;
    this.biometricType = biometricType; // 'FACE' | 'FINGERPRINT'
    this.inputFile = inputFile;
    this.originalFilename = originalFilename;
    this.mimeType = mimeType;
    this.fileSize = fileSize;
    this.fingerName = fingerName;
    this.status = status; // 'PENDING' | 'COMPLETED' | 'NO_MATCH' | 'FAILED'
    this.createdAt = new Date().toISOString();
    this.completedAt = null;
    this.candidateCount = 0;
  }

  markCompleted(candidates = []) {
    this.candidateCount = candidates.length;
    this.status = candidates.length > 0 ? 'COMPLETED' : 'NO_MATCH';
    this.completedAt = new Date().toISOString();
  }

  markFailed() {
    this.status = 'FAILED';
    this.completedAt = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      caseId: this.caseId,
      biometricType: this.biometricType,
      inputFile: this.inputFile,
      originalFilename: this.originalFilename,
      mimeType: this.mimeType,
      fileSize: this.fileSize,
      fingerName: this.fingerName,
      status: this.status,
      candidateCount: this.candidateCount,
      createdAt: this.createdAt,
      completedAt: this.completedAt
    };
  }
}

export class BiometricCandidate {
  constructor({
    id,
    searchRequestId,
    subjectId,
    caseId,
    displayName,
    matchType = 'TEST_MODE_EXACT_MAP',
    similarityScore = 0.985,
    reviewStatus = 'PENDING_HUMAN_REVIEW',
    enrolledImagePath = '',
    probeImagePath = '',
    fingerName = null,
    matchLabel = 'MATCH',
    dataset = 'NETRISH Synthetic Biometric Test Dataset',
    isSynthetic = true
  }) {
    this.id = id || `CAND-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.searchRequestId = searchRequestId;
    this.subjectId = subjectId;
    this.caseId = caseId;
    this.displayName = displayName;
    this.matchType = matchType;
    this.similarityScore = similarityScore;
    this.reviewStatus = reviewStatus;
    this.enrolledImagePath = enrolledImagePath;
    this.probeImagePath = probeImagePath;
    this.fingerName = fingerName;
    this.matchLabel = matchLabel;
    this.dataset = dataset;
    this.isSynthetic = isSynthetic;
    this.mode = 'TEST MODE';
    this.matchedAt = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      searchRequestId: this.searchRequestId,
      subjectId: this.subjectId,
      caseId: this.caseId,
      displayName: this.displayName,
      matchType: this.matchType,
      similarityScore: this.similarityScore,
      reviewStatus: this.reviewStatus,
      enrolledImagePath: this.enrolledImagePath,
      probeImagePath: this.probeImagePath,
      fingerName: this.fingerName,
      matchLabel: this.matchLabel,
      dataset: this.dataset,
      isSynthetic: this.isSynthetic,
      mode: this.mode,
      matchedAt: this.matchedAt
    };
  }
}
