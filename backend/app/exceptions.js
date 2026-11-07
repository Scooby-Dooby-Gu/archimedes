
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