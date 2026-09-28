export interface Kadinlar2LigMetadata {
  lig_adi: string;
  sezon: string;
  kategori: string;
  guncellenme_zamani: string;
  toplam_grup_sayisi: number;
  toplam_takim_sayisi: number;
  toplam_mac_sayisi: number;
  volleybox_eslesme_sayisi: number;
  resmi_kaynaklar: {
    tvf_puan_durumu: string;
    tvf_fikstur: string;
    tvf_fsw_portal: string;
    volleybox_turnuva: string;
    volleybox_maclar: string;
  };
}

export interface Kadinlar2LigTeam {
  sira: number;
  takim_id: string;
  takim_adi: string;
  o: number;
  g: number;
  m: number;
  p: number;
  as: number;
  vs: number;
  sav: string;
  asp: number;
  vsp: number;
  spav: string;
  a3_0: number;
  a3_1: number;
  a3_2: number;
  v2_3: number;
  v1_3: number;
  v0_3: number;
  logo: string;
  sezon: string;
  volleybox_url?: string | null;
  volleybox_name?: string | null;
  grup_no: number;
  grup_adi?: string;
  sehir?: string;
}

export interface Kadinlar2LigMatch {
  id: string;
  mac_no: string;
  grup_no: number;
  grup_adi: string;
  hafta: number;
  devre: number;
  tarih: string;
  gun: string;
  saat: string;
  sehir: string;
  salon: string;
  takim_a: string;
  takim_b: string;
  takim_a_id: string;
  takim_b_id: string;
  takim_a_logo: string;
  takim_b_logo: string;
  set_a: string;
  set_b: string;
  skor: string;
  set_sonuclari: string;
  durum: "BİTTİ" | "OYNANACAK";
  mac_durumu_kod: string;
  takim_a_volleybox_url?: string | null;
  takim_b_volleybox_url?: string | null;
}

export interface Kadinlar2LigGroup {
  grup_no: number;
  grup_adi: string;
  takim_sayisi: number;
  mac_sayisi: number;
  puan_durumu: Kadinlar2LigTeam[];
  fikstur: Kadinlar2LigMatch[];
}

export interface Kadinlar2LigData {
  metadata: Kadinlar2LigMetadata;
  gruplar: Kadinlar2LigGroup[];
  tum_maclar: Kadinlar2LigMatch[];
  tum_takimlar: Kadinlar2LigTeam[];
}
