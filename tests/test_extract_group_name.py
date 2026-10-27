import pytest
from scripts.scrape_all_provinces import extract_group_name


def test_extract_group_name_yari_final():
    assert extract_group_name("Süper Lig Genç Kız - Y.Final-B Gr") == "Yarı Final B Grubu"
    assert extract_group_name("Süper Lig Yıldız Kızlar - Y.Final-A Gr") == "Yarı Final A Grubu"
    assert extract_group_name("Genç Kızlar Süper Lig - Yarı Final - B Grubu") == "Yarı Final B Grubu"
    assert extract_group_name("Yarı Final A Grubu") == "Yarı Final A Grubu"
    assert extract_group_name("Genç Kızlar - Y-Final B") == "Yarı Final B Grubu"


def test_extract_group_name_final():
    assert extract_group_name("Genç Kızlar Süper Lig - Final - Final Etabı") == "Final Etabı"
    assert extract_group_name("Genç Kızlar Süper Lig - Final - Final Grubu") == "Final Grubu"
    assert extract_group_name("Genç Kızlar Süper Lig - Final - A Grubu") == "Final A Grubu"


def test_extract_group_name_klasman():
    assert extract_group_name("Genç Kızlar - Klasman - A Grubu") == "Klasman A Grubu"
    assert extract_group_name("Genç Kızlar - Klasman Etabı") == "Klasman Etabı"


def test_extract_group_name_regular():
    assert extract_group_name("Genç Kızlar - A Grubu") == "A Grubu"
    assert extract_group_name("Yıldız Kızlar - B Gr") == "B Grubu"
    assert extract_group_name("Genç Kızlar - 1. Grup") == "1. Grup"
