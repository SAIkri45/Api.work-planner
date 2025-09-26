class BaseException extends Error {
    status;
    isOperational;
    errData;
    constructor(status, message, isOperational, errData) {
        super(message);
        this.status = status;
        this.isOperational = isOperational;
        this.errData = errData;
    }
}
export default BaseException;
