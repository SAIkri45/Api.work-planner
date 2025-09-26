import { DEF_400 } from "../constants/appMessages.js";
import BaseException from "./baseException.js";
class BadRequestException extends BaseException {
    constructor(message) {
        super(400, message || DEF_400, true);
    }
}
export default BadRequestException;
