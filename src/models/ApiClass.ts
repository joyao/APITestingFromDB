export class ApiStatus {
    private _ID: string;
    private _APIInfo: string;
    private _Name: string;
    private _Status: number;
    private _LastUpdate: string;
    private _Memo: string;
    private _DataVerified: boolean;
    private _DuringTime: number;
    private _Type: string;

    constructor(
        ID: string,
        APIInfo: string,
        Name: string,
        Status: number,
        LastUpdate: string,
        Memo: string,
        DataVerified: boolean,
        DuringTime: number,
        Type: string
    ) {
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

    get ID(): string {
        return this._ID;
    }
    set ID(id: string) {
        this._ID = id;
    }

    get APIInfo(): string {
        return this._APIInfo;
    }
    set APIInfo(i: string) {
        this._APIInfo = i;
    }

    get Name(): string {
        return this._Name;
    }
    set Name(n: string) {
        this._Name = n;
    }

    get Status(): number {
        return this._Status;
    }
    set Status(s: number) {
        this._Status = s;
    }

    get LastUpdate(): string {
        return this._LastUpdate;
    }
    set LastUpdate(d: string) {
        this._LastUpdate = d;
    }

    get Memo(): string {
        return this._Memo;
    }
    set Memo(m: string) {
        this._Memo = m;
    }

    get DataVerified(): boolean {
        return this._DataVerified;
    }
    set DataVerified(m: boolean) {
        this._DataVerified = m;
    }

    get DuringTime(): number {
        return this._DuringTime;
    }
    set DuringTime(t: number) {
        this.DuringTime = t;
    }

    get Type(): string {
        return this._Type;
    }
    set Type(t: string) {
        this.Type = t;
    }
}

export class ApiResult {
    private _Status: number;
    private _Data: string;

    constructor(Status: number, Data: string) {
        this._Status = Status;
        this._Data = Data;
    }

    get Status(): number {
        return this._Status;
    }

    get Data(): string {
        return this._Data;
    }
}
