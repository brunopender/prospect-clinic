/**
 * Request to generate messages for multiple leads in batch
 */
export interface BatchGenerateRequest {
  /** List of lead IDs to process */
  ids?: string[];
  /** Process all leads without messages */
  all?: boolean;
  /** Force regeneration even if message already exists */
  force?: boolean;
}

/**
 * Result of batch message generation
 */
export interface BatchGenerateResult {
  /** Number of leads successfully processed */
  processed: number;
  /** Number of leads that failed */
  errors: number;
  /** Detailed results for each lead */
  details: Array<{
    /** ID of the processed lead */
    leadId: string;
    /** Whether message generation was successful */
    success: boolean;
    /** Error message if failed */
    error?: string;
  }>;
}
