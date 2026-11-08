
export class Unauthorized extends Error {
    constructor(message) {
        super()
        if (message) 
            this.message = message
    }
    status = 401
    message = 'Please log in first'
}

export class UnauthorizedAdmin extends Unauthorized {
    constructor(message) {
        super()
        if (message) 
            this.message = message
    }
    status = 401
    message = 'This action can only be performed by admin'
}

export class UnauthorizedManager extends Unauthorized {
    constructor(message) {
        super()
        if (message) 
            this.message = message
    }
    status = 401
    message = 'This action can only be performed by company manager'
}

export class UnauthorizedMember extends Unauthorized {
    constructor(message) {
        super()
        if (message) 
            this.message = message
    }
    status = 401
    message = 'This action can only be performed by company member'
}

export class UnauthorizedWriter extends Unauthorized {
    constructor(message) {
        super()
        if (message) 
            this.message = message
    }
    status = 401
    message = 'This action can only be performed by writers, moderators or admins'
}

export class NotFound extends Error {
    constructor(message) {
        super()
        if (message) 
            this.message = message
    }
    status = 404
    message = 'Resource not found'
}
export class BadRequest extends Error {
    constructor(message) {
        super()
        if (message) 
            this.message = message
    }
    status = 400
    message = 'Bad request'
}
// Signed in, but not allowed to touch this record (someone else's post or
// account). 403 rather than 401 so the app doesn't treat it as signed out.
export class Forbidden extends Error {
    constructor(message) {
        super()
        if (message) 
            this.message = message
    }
    status = 403
    message = "You don't have permission to do that"
}

export class TooManyRequests extends Error {
    constructor(message) {
        super()
        if (message) 
            this.message = message
    }
    status = 429
    message = 'Too many attempts. Please wait a few minutes and try again.'
}
