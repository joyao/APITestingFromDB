# API 測試小程式 V2 - 從資料庫撈取

本測試小程式與前一版的作用差不多，但提升了程式碼的高可用性與全數資料皆從資料庫撈取

此程式`還在開發中`，撈取所有地圖服務並自動測試的功能尚未完成，請見諒

主要使用的語言：`Node.js`, `typescript`

執行環境所需套件：`Node.js`, `SQL Server`, `ArcGIS Server`, `Mail Server`

## 安裝套件

```properties
npm install
```

## 主要進入程式 app.js

### 資料庫參數表`[dbo].[APITestingParam]`：

```sql
/****** Object:  Table [dbo].[APITestingParam]    Script Date: 2021/5/14 下午 11:03:55 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[APITestingParam](
	[OBJECTID] [int] IDENTITY(1,1) NOT NULL,
	[Type] [nvarchar](50) NULL,
	[APIInfo] [nvarchar](200) NULL,
	[ContentType] [nvarchar](20) NULL,
	[RequestMethod] [nvarchar](10) NULL,
	[URL] [nvarchar](max) NULL,
	[JsonData] [nvarchar](max) NULL,
	[ParamMethod] [nvarchar](30) NULL,
	[ExpectResponse] [nvarchar](max) NULL,
	[HeaderTokenConfig] [nvarchar](50) NULL,
	[Monitoring] [bit] NOT NULL,
	[Frequency] [int] NULL,
	[Status] [int] NULL,
	[LastUpdate] [datetime] NULL,
	[DataVerified] [bit] NULL,
	[Memo] [nvarchar](256) NULL,
	[DuringTime] [float] NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[APITestingParam] ON

INSERT [dbo].[APITestingParam] ([OBJECTID], [Type], [APIInfo], [ContentType], [RequestMethod], [URL], [JsonData], [ParamMethod], [ExpectResponse], [HeaderTokenConfig], [Monitoring], [Frequency], [Status], [LastUpdate], [DataVerified], [Memo], [DuringTime]) VALUES (1, N'HLUPAPI', N'取得土地資料(利用段號)', N'JSON', N'POST', N'https://map.hl.gov.tw/HLUPAPI/api/BasicInfo/getLandsbySecID', N'{"Town":"花蓮市","SecNum":"0017"}', N'RequestPayload', N'', N'PRIVATEAPI_TOKEN', 1, 5, 200, CAST(N'2021-04-26T13:06:58.557' AS DateTime), 1, N'', 0.855)
SET IDENTITY_INSERT [dbo].[APITestingParam] OFF
ALTER TABLE [dbo].[APITestingParam] ADD  CONSTRAINT [DF_APITestingParam_Monitoring]  DEFAULT ((1)) FOR [Monitoring]
GO
ALTER TABLE [dbo].[APITestingParam] ADD  CONSTRAINT [DF_APITestingParam_Frequency]  DEFAULT ((60)) FOR [Frequency]
GO
ALTER TABLE [dbo].[APITestingParam] ADD  CONSTRAINT [DF_APITestingParam_DataVerified]  DEFAULT ((0)) FOR [DataVerified]
GO
```

### 欄位描述

-   Type - nvarchar(50)
    -   API 的類型，目前 5 種，分別為：
        1. HLUPAPI (內部使用 API)
        2. oDataAPI (外部使用 API)
        3. OtherAPI (介接外部的 API)
        4. ArcGISServer (地圖服務)
        5. ArcGISServer_GP (地圖資料處理服務)
-   APIInfo - nvarchar(200)
    -   描述 API 的內容，中文
-   ContentType - nvarchar(20)
    -   Request 傳遞方式，目前有三種：JSON、XML、IMAGE-jpeg
-   RequestMethod - nvarchar(10)
    -   Request 方法，目前有：POST、GET
-   URL - nvarchar(MAX)
    -   API 路徑，注意!! 這不是唯一值，不能當作 Key
-   JsonData - nvarchar(MAX)
    -   "傳遞的資料，全部以 JSON 格式表示，程式會自己判斷 ParamMethod 再轉換後發 Request 若不用傳資料則是空白"
-   ParamMethod - nvarchar(30)
    -   "資料傳遞格式，目前有 4 種。
        1. RequestPayload:一般的 Post 傳遞 JSON 內容;
        2. QueryString:路徑 ?後 帶參數;
        3. RouteParameter:直接將參數帶進路徑;
        4. FormData:XML 格式傳遞"
-   ExpectResponse - nvarchar(MAX)
    -   預期回來的資料，若有輸入值則會驗證值是否相同，若是"..."表示只會會驗證是否有資料、若沒有填寫的資料則不驗證，這個欄位可能會很長~
-   HeaderTokenConfig - nvarchar(50)
    -   "API 所需要的 Token，目前有三種 + 空白：
        1. PRIVATEAPI_TOKEN:內部 API 使用的 Token ;
        2. PUBLICAPI_TOKEN:外部 API 使用的 Token;
        3. ARCGISSERVER_TOKEN:地圖服務使用的 Token";
-   Monitoring - bit
    -   是否要監測，1 : 是、0 : 否
-   Frequency - int
    -   監測頻率 (單位：分鐘)
-   Status - int
    -   回傳狀態，正常應該要 200，若 Timeout 等抓不到回傳內容，則會顯示-1，但其他狀態就是看回傳哪個狀態碼"
-   LastUpdate - datetime
    -   最後一次監測回傳更新時間
-   DataVerified - bit
    -   最後一次回傳是否有通過驗證 (有些雖然 Status 狀態是 200，但資料格式不符合，這邊會顯示 0)
-   Memo - nvarchar(256)
    -   備註，通常是在有不符合資料格式的時候才會有值
-   DuringTime - float
    -   這個 Request 從發出去到接收中間經過的時間 (單位：秒)

---

### Log 資料表`[dbo].[APITestingLog]`：

```sql
/****** Object:  Table [dbo].[APITestingLog]    Script Date: 2021/5/14 下午 11:03:54 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[APITestingLog](
	[ID] [int] NULL,
	[Type] [nvarchar](50) NULL,
	[APIInfo] [nvarchar](50) NULL,
	[Name] [nvarchar](256) NULL,
	[Status] [int] NULL,
	[LastUpdate] [datetime] NULL,
	[DataVerified] [bit] NOT NULL,
	[Memo] [nvarchar](256) NULL,
	[DuringTime] [float] NULL
) ON [PRIMARY]
GO
```

## 設定檔

#### 未編譯前： src/config/config.ts

```ts
export const DB_SERVER: string = "xxx.xxx.xxx.xxx\\SQL2017EXPR";
export const DB_PORT: number = 1433;
export const DB_USER: string = "user";
export const DB_PASSWORD: string = "password";
export const INIT_DATABASE: string = "DB";
export const MAIL_FROM: string = "test@google.com";
export const MAIL_TO: string = "test01@google.com";
export const MAIL_SERVER_HOST: string = "xxx.xxx.xxx.xxx";
export const MAIL_SERVER_PORT: number = 25;
export const MAPSERVICE_USER_NAME: string = "mapuser";
export const MAPSERVICE_PASSWORD: string = "mappassword";
export const MAPSERVICE_PROXY: string = "https://xxx.xxx.xxx.tw/xxxx/xxxx/proxy.ashx";
export const MAPSERVICE_URL: string = "https://xxx.xxx.xxx.tw/arcgis";
export const PRIVATEAPI_TOKEN: Object = {
    authorization: "privateapitoken",
};
export const PUBLICAPI_TOKEN: Object = {
    authorization: "publicapitoken",
};
```

#### 編譯後： dist/config/config.js

```js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUBLICAPI_TOKEN = exports.PRIVATEAPI_TOKEN = exports.MAPSERVICE_URL = exports.MAPSERVICE_PROXY = exports.MAPSERVICE_PASSWORD = exports.MAPSERVICE_USER_NAME = exports.MAIL_SERVER_PORT = exports.MAIL_SERVER_HOST = exports.MAIL_TO = exports.MAIL_FROM = exports.INIT_DATABASE = exports.DB_PASSWORD = exports.DB_USER = exports.DB_PORT = exports.DB_SERVER = void 0;
exports.DB_SERVER = "xxx.xxx.xxx.xxx\\SQL2017EXPR";
exports.DB_PORT = 1433;
exports.DB_USER = "user";
exports.DB_PASSWORD = "password";
exports.INIT_DATABASE = "DB";
exports.MAIL_FROM = "test@google.com";
exports.MAIL_TO = "test@google.com";
exports.MAIL_SERVER_HOST = "xxx.xxx.xxx.xxx";
exports.MAIL_SERVER_PORT = 25;
exports.MAPSERVICE_USER_NAME = "mapuser";
exports.MAPSERVICE_PASSWORD = "mappassword";
exports.MAPSERVICE_PROXY: string = "https://xxx.xxx.xxx.tw/xxxx/xxxx/proxy.ashx";
exports.MAPSERVICE_URL: string = "https://xxx.xxx.xxx.tw/arcgis";
exports.PRIVATEAPI_TOKEN: Object = {
    authorization: "privateapitoken",
};
exports.PUBLICAPI_TOKEN: Object = {
    authorization: "publicapitoken",
};
```

## 執行編譯

#### 利用 typescript 原生套件

```properties
npm run build
```

#### 利用 Gulp 套件 (只能 es5 以下)

```properties
npm run build-gulp
```

## 執行程式

```properties
npm run start
```

## 執行結果

每一筆測試結果皆會存在 runTesting.log 檔案中，且會存進資料庫

若有測試錯誤的情形，則會寄 Email 給通知管理者
