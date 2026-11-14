
const sql = require("mssql/msnodesqlv8");

// Cấu hình kết nối SQL Server bằng Windows Authentication
const config = {
    server: "localhost\\SQL2022",
    database: "CenDeli",

    options: {
        trustedConnection: true,
        trustServerCertificate: true
    }
};

// Hàm kết nối database
async function connectDB() {
    try {
        const pool = await sql.connect(config);

        console.log("Kết nối SQL Server thành công!");
        console.log("Database:", config.database);

        return pool;
    } catch (error) {
        console.error("Kết nối SQL Server thất bại!");
        console.error("Chi tiết lỗi:", error.message);

        throw error;
    }
}

module.exports = {
    sql,
    connectDB
};
