# 農場預約系統 (Farm Booking System)

古坑大自然莊園 / 關廟護生園區 預約與報名管理系統。

## 功能特色

- **多層權限管理**：系統管理員、商家管理、預約管理、教室管理、一般學員
- **多場地支援**：古坑大自然莊園、關廟護生園區，各自獨立管理設定
- **兩階段預約**：教室先預約時段 + 初估人數 → 確認後開放報名 → 最終人數回饋
- **併團管理**：商家可查看剩餘容量，決定是否開放併團
- **報名表系統**：範本套用 + 個別修改，支援個資/保險欄位分層可見
- **資料隱私**：學員個資/保險資料僅教室可見，商家僅見彙總
- **匯出功能**：教室匯出名單 (CSV)、商家匯出彙總 (CSV)
- **雙選項報名**：教室可提供多個日期/場地選項供學員擇一或複選

## 技術棧

- **前端/後端**：Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **資料庫**：Prisma ORM + SQLite (開發) / PostgreSQL (生產)
- **認證**：NextAuth.js v5 (Credentials)
- **部署**：Vercel + 環境變數設定

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 環境變數

複製 `.env.example` 為 `.env.local` 並填入：

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
```

生產環境（Vercel）請設定為 PostgreSQL 連線字串。

### 3. 資料庫初始化

```bash
npx prisma db push
npx tsx prisma/seed.ts
npx tsx prisma/seed-slots.ts
```

### 4. 啟動開發伺服器

```bash
npm run dev
```

開啟 http://localhost:3000

### 測試帳號

| 角色 | Email | 密碼 |
|------|-------|------|
| 系統管理員 | admin@example.com | admin123 |
| 商家管理 (古坑) | gukeng@example.com | merchant123 |
| 教室管理 (雲林) | yunlin@example.com | classroom123 |

## 專案結構

```
src/
├── app/
│   ├── api/           # API 路由
│   │   ├── auth/      # NextAuth
│   │   ├── bookings/  # 預約 CRUD
│   │   ├── export/    # CSV 匯出
│   │   ├── registrations/  # 報名 CRUD
│   │   ├── slots/     # 場次 CRUD
│   │   └── venues/    # 場地 CRUD
│   ├── admin/         # 系統管理後台
│   ├── classroom/     # 教室管理
│   ├── dashboard/     # 儀表板
│   ├── merchant/      # 商家管理
│   ├── register/      # 報名表單
│   ├── student/       # 學員報名
│   └── venues/        # 場地與時段
├── components/        # 共用元件
├── lib/               # 工具函式
│   ├── auth.ts        # NextAuth 設定
│   ├── constants.ts   # 常數定義
│   ├── permissions.ts # 權限判斷
│   └── prisma.ts      # Prisma Client
└── proxy.ts           # 路由守衛
prisma/
├── schema.prisma      # 資料模型
├── seed.ts            # 種子資料
└── seed-slots.ts      # 場次種子
```

## 部署到 Vercel

1. 推送程式碼到 GitHub
2. 在 Vercel 匯入專案
3. 設定環境變數：`DATABASE_URL` (PostgreSQL), `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
4. 將 `prisma/schema.prisma` 的 provider 改為 `postgresql`
5. 執行 `npx prisma db push` 建立資料表
6. 執行 seed 腳本初始化資料

## 授權

MIT
