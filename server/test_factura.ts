import { db, invoices, paymentStages, companyBillingInfo, clientBillingInfo } from "./db";
import { eq } from "drizzle-orm";
import { construirDocumentoFacturaSend, enviarFacturaFacturaSend, extraerResultadoFacturaSend } from "./facturasend";

async function testInvoice() {
  console.log("🚀 Iniciando prueba de FacturaSend...");
  
  const stageId = 138;
  
  try {
    const stage = await db.select().from(paymentStages).where(eq(paymentStages.id, stageId)).limit(1);
    if (!stage.length) throw new Error("Etapa no encontrada");
    
    const project = { id: stage[0].projectId, name: "Barbershop Test" };
    const company = await db.select().from(companyBillingInfo).where(eq(companyBillingInfo.isActive, true)).limit(1);
    const client = await db.select().from(clientBillingInfo).where(eq(clientBillingInfo.userId, 2)).limit(1);
    const invoice = await db.select().from(invoices).where(eq(invoices.paymentStageId, stageId)).limit(1);
    
    if (!invoice.length) throw new Error("Factura no encontrada");

    console.log("📦 Construyendo documento...");
    const documento = await construirDocumentoFacturaSend(
      company[0],
      client[0],
      stage[0],
      project,
      parseFloat(stage[0].exchangeRateUsed || "7300"),
      parseInt(invoice[0].invoiceNumber.split('-').pop() || "0")
    );

    console.log("📤 Enviando a FacturaSend...");
    const response = await enviarFacturaFacturaSend(documento);
    
    console.log("📥 Respuesta Raw:", JSON.stringify(response));
    
    const resultado = extraerResultadoFacturaSend(response);
    console.log("📊 Resultado Procesado:", JSON.stringify(resultado));

    if (response.success) {
      console.log("✅ PRUEBA EXITOSA: Factura aprobada por FacturaSend");
      process.exit(0);
    } else {
      console.log("❌ PRUEBA FALLIDA: Factura rechazada");
      process.exit(1);
    }
  } catch (err) {
    console.error("💥 Error en la prueba:", err);
    process.exit(1);
  }
}

testInvoice();
