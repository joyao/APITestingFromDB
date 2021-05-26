"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResult = exports.ApiStatus = void 0;
class ApiStatus {
    constructor(ID, APIInfo, Name, Status, LastUpdate, Memo, DataVerified, DuringTime, Type) {
        this._ID = ID;
        this._APIInfo = APIInfo;
        this._Name = Name;
        this._Status = Status;
        this._LastUpdate = LastUpdate;
        this._Memo = Memo;
        this._DataVerified = DataVerified;
        this._DuringTime = DuringTime;
        this._Type = Type;
    }
    get ID() {
        return this._ID;
    }
    set ID(id) {
        this._ID = id;
    }
    get APIInfo() {
        return this._APIInfo;
    }
    set APIInfo(i) {
        this._APIInfo = i;
    }
    get Name() {
        return this._Name;
    }
    set Name(n) {
        this._Name = n;
    }
    get Status() {
        return this._Status;
    }
    set Status(s) {
        this._Status = s;
    }
    get LastUpdate() {
        return this._LastUpdate;
    }
    set LastUpdate(d) {
        this._LastUpdate = d;
    }
    get Memo() {
        return this._Memo;
    }
    set Memo(m) {
        this._Memo = m;
    }
    get DataVerified() {
        return this._DataVerified;
    }
    set DataVerified(m) {
        this._DataVerified = m;
    }
    get DuringTime() {
        return this._DuringTime;
    }
    set DuringTime(t) {
        this.DuringTime = t;
    }
    get Type() {
        return this._Type;
    }
    set Type(t) {
        this.Type = t;
    }
}
exports.ApiStatus = ApiStatus;
class ApiResult {
    constructor(Status, Data) {
        this._Status = Status;
        this._Data = Data;
    }
    get Status() {
        return this._Status;
    }
    get Data() {
        return this._Data;
    }
}
exports.ApiResult = ApiResult;
