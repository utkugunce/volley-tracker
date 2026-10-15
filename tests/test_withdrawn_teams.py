import unittest
from scripts.scrape_all_provinces import is_withdrawn_team


class TestWithdrawnTeams(unittest.TestCase):
    def test_eskisehir_meryem_boz_a_not_withdrawn(self):
        """Meryem Boz (A) takımı ligde aktif oynuyor, 'boz' içindeki ' b' yüzünden çekildi sayılmamalı."""
        self.assertFalse(
            is_withdrawn_team(
                "Meryem Boz Spor Kulübü (A)",
                city="Eskişehir",
                category="Yıldız Kızlar Süper Lig",
                group="C Grubu",
            )
        )
        self.assertFalse(
            is_withdrawn_team(
                "Meryem Boz Spor Kulübü",
                city="Eskişehir",
                category="Genç Kızlar Süper Lig",
                group="B Grubu",
            )
        )

    def test_eskisehir_meryem_boz_b_is_withdrawn(self):
        """Meryem Boz - B takımı ligden çekildi, doğru şekilde filtrelenmeli."""
        self.assertTrue(
            is_withdrawn_team(
                "Meryem Boz Spor Kulübü (B)",
                city="Eskişehir",
                category="Yıldız Kızlar Süper Lig",
                group="A Grubu",
            )
        )
        self.assertTrue(
            is_withdrawn_team(
                "Meryem Boz Spor Kulübü - B",
                city="Eskişehir",
                category="Yıldız Kızlar Süper Lig",
                group="A Grubu",
            )
        )
        self.assertTrue(
            is_withdrawn_team(
                "Meryem Boz Spor Kulübü (B) - (Çekildi)",
                city="Eskişehir",
                category="Yıldız Kızlar Süper Lig",
                group="A Grubu",
            )
        )

    def test_explicit_cekildi_keyword(self):
        self.assertTrue(is_withdrawn_team("Herhangi Bir Takım (Çekildi)", city="Ankara"))

    def test_canakkale_uvm_scoped_to_canakkale(self):
        self.assertTrue(is_withdrawn_team("UVM Akademi", city="Çanakkale"))
        self.assertFalse(is_withdrawn_team("UVM Akademi", city="Bursa"))

    def test_istanbul_basaksehir_scoped_to_istanbul_and_group(self):
        self.assertTrue(
            is_withdrawn_team(
                "Başakşehir Belediye",
                city="İstanbul",
                category="Genç Kızlar 1. Lig",
                group="4. Bölge",
            )
        )
        self.assertFalse(
            is_withdrawn_team(
                "Başakşehir Belediye",
                city="İstanbul",
                category="Genç Kızlar 1. Lig",
                group="1. Bölge",
            )
        )
        self.assertFalse(
            is_withdrawn_team(
                "Başakşehir Belediye",
                city="Ankara",
                category="Genç Kızlar 1. Lig",
                group="4. Bölge",
            )
        )


if __name__ == "__main__":
    unittest.main()
