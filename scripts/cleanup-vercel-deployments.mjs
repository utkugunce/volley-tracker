#!/usr/bin/env node
/**
 * scripts/cleanup-vercel-deployments.mjs
 *
 * Vercel Eski Dağıtım (Deployment) Temizleme Betiği (Görev 7 / Storage Kurtarma).
 *
 * Vercel Hobby 10 GB Deployment Storage kotasını korumak için, son N başarılı
 * dağıtım haricindeki eski dağıtımları Vercel REST API üzerinden siler.
 *
 * Ortam Değişkenleri:
 *   - VERCEL_TOKEN: Vercel Access Token (zorunlu)
 *   - VERCEL_PROJECT_ID veya PROJECT_ID: Proje kimliği (opsiyonel, verilmezse repodan aranır)
 *   - VERCEL_TEAM_ID: Takım kimliği (opsiyonel)
 *   - KEEP_COUNT: Korunacak dağıtım sayısı (varsayılan: 5)
 *   - DRY_RUN: "1" veya "true" ise silmeden sadece listeler
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID || process.env.PROJECT_ID || "volley-tracker";
const TEAM_ID = process.env.VERCEL_TEAM_ID;
const KEEP_COUNT = parseInt(process.env.KEEP_COUNT || "5", 10);
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true" || process.argv.includes("--dry-run");

if (!VERCEL_TOKEN) {
  console.log("ℹ️  VERCEL_TOKEN ortam değişkeni tanımlı değil. Dağıtım temizleme atlandı.");
  process.exit(0);
}

const headers = {
  Authorization: `Bearer ${VERCEL_TOKEN}`,
  "Content-Type": "application/json",
};

async function fetchDeployments() {
  const query = new URLSearchParams({
    limit: "50",
    ...(PROJECT_ID ? { projectId: PROJECT_ID } : {}),
    ...(TEAM_ID ? { teamId: TEAM_ID } : {}),
  });

  const url = `https://api.vercel.com/v6/deployments?${query.toString()}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Dağıtımlar alınamadı (${res.status}): ${errorText}`);
  }
  const data = await res.json();
  return data.deployments || [];
}

async function deleteDeployment(uid, url) {
  const query = new URLSearchParams(TEAM_ID ? { teamId: TEAM_ID } : {});
  const endpoint = `https://api.vercel.com/v13/deployments/${uid}?${query.toString()}`;

  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Silinecek dağıtım: ${uid} (${url})`);
    return true;
  }

  const res = await fetch(endpoint, { method: "DELETE", headers });
  if (!res.ok) {
    const err = await res.text();
    console.error(`  ❌ Dağıtım silinemedi (${uid}): ${err}`);
    return false;
  }
  console.log(`  🗑️  Başarıyla silindi: ${uid} (${url})`);
  return true;
}

async function main() {
  console.log(`\n🧹 [Vercel Deployment Cleanup] Başlatılıyor (Hedef: ${PROJECT_ID}, Korunacak: ${KEEP_COUNT})...\n`);

  const deployments = await fetchDeployments();
  console.log(`Toplam ${deployments.length} adet dağıtım bulundu.`);

  if (deployments.length <= KEEP_COUNT) {
    console.log(`Dağıtım sayısı (${deployments.length}) koruma sınırının (${KEEP_COUNT}) altında; silinecek dağıtım yok.`);
    return;
  }

  // Dağıtımları tarihe göre azalan sırala (en yeniden en eskiye)
  const sorted = [...deployments].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const toKeep = sorted.slice(0, KEEP_COUNT);
  const toDelete = sorted.slice(KEEP_COUNT);

  console.log(`\n✅ Korunan son ${toKeep.length} dağıtım:`);
  for (const dep of toKeep) {
    const date = new Date(dep.createdAt || dep.created).toISOString();
    console.log(`   - ${dep.uid} | ${dep.url} | ${date} | state=${dep.state}`);
  }

  console.log(`\n🚨 Silinecek ${toDelete.length} eski dağıtım:`);
  let deletedCount = 0;
  for (const dep of toDelete) {
    const ok = await deleteDeployment(dep.uid, dep.url);
    if (ok) deletedCount++;
  }

  console.log(`\n✨ Temizlik tamamlandı: ${deletedCount} eski dağıtım kaldırıldı.\n`);
}

main().catch((err) => {
  console.error("Beklenmeyen hata:", err);
  process.exit(1);
});
