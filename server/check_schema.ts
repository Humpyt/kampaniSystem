import db from "./database";

async function checkSchema() {
  try {
    const columns = await db.all(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position",
      ["operations"]
    );
    console.log("\n📋 Operations Table Columns:\n");
    columns.forEach((col: any) => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    const hasDiscount = columns.some((col: any) => col.column_name === "discount");
    console.log(`\n${hasDiscount ? "✅" : "❌"} Discount column: ${hasDiscount ? "EXISTS" : "NOT FOUND"}\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkSchema();
