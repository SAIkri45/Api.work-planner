import { DEF_401 } from "../constants/appMessages.js";
import BaseException from "./baseException.js";

class UnauthorizedException extends BaseException {
  constructor(message: string) {
    super(401, message || DEF_401, true);
  }
}

export default UnauthorizedException;
