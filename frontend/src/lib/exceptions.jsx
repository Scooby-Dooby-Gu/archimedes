
export class Unauthorized extends Error {
  constructor(message) {
    super();
    this.status =  401
    this.message = message ||  'Please log in first'
  }
}


export class NotFound extends Error {
  constructor(message) {
    super()
    this.status =  401
    this.message = message ||  'Resource not found'
  }
}