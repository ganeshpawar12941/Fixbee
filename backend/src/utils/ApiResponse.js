/**
 * Standardised API response wrapper.
 * Ensures every success response has the same JSON shape.
 */
class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code (2xx range)
   * @param {*}      data       - Payload to return to the client
   * @param {string} message    - Human-readable success message
   */
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export default ApiResponse;
