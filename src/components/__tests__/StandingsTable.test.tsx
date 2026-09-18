import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StandingsTable } from '../StandingsTable';
import { StandingItem } from '@/types/fixture';

describe('StandingsTable Component', () => {
  const mockItemA: StandingItem = {
    rank: 1,
    team: 'Eczacıbaşı A',
    played: 5,
    won: 5,
    lost: 0,
    points: 15,
    sets_won: 15,
    sets_lost: 1,
    set_ratio: '15.00',
    points_won: 375,
    points_lost: 250,
    point_ratio: '1.50',
    form: ['W', 'W', 'W', 'W', 'W'],
  };

  const mockItemB: StandingItem = {
    rank: 1,
    team: 'Fenerbahçe B',
    played: 5,
    won: 4,
    lost: 1,
    points: 12,
    sets_won: 13,
    sets_lost: 4,
    set_ratio: '3.25',
    points_won: 350,
    points_lost: 280,
    point_ratio: '1.25',
    form: ['W', 'W', 'L', 'W', 'W'],
  };

  it('(a) seçili grup için veri varken doğru veri gösteriliyor', () => {
    const standingsData = {
      'Genç Kızlar Süper Lig - A Grubu': [mockItemA],
      'Genç Kızlar Süper Lig - B Grubu': [mockItemB],
    };

    render(<StandingsTable standingsData={standingsData} />);

    // Başlangıçta A Grubu seçili ve Eczacıbaşı görünmeli
    expect(screen.getByText(/Eczacıbaşı/i)).toBeInTheDocument();
    expect(screen.queryByText(/Fenerbahçe/i)).not.toBeInTheDocument();

    // B Grubu butonuna tıklanınca Fenerbahçe görünmeli, Eczacıbaşı gitmeli
    const groupBBtn = screen.getByRole('button', { name: 'B Grubu' });
    fireEvent.click(groupBBtn);

    expect(screen.getByText(/Fenerbahçe/i)).toBeInTheDocument();
    expect(screen.queryByText(/Eczacıbaşı/i)).not.toBeInTheDocument();
  });

  it('(b) seçili grup için veri yokken boş durum gösteriliyor ve yanlış veri sızmıyor', () => {
    // Sadece A Grubu verisi var, ancak B Grubu anahtarı boş veya tanımlanmamış
    const standingsData = {
      'Genç Kızlar Süper Lig - A Grubu': [mockItemA],
    };

    // Boş veri içeren durum simülasyonu
    const emptyStandings = {
      'Genç Kızlar Süper Lig - A Grubu': [mockItemA],
      'Genç Kızlar Süper Lig - B Grubu': [] as StandingItem[],
    };

    render(<StandingsTable standingsData={emptyStandings} />);

    // A Grubunda veri var
    expect(screen.getByText(/Eczacıbaşı/i)).toBeInTheDocument();

    // B Grubu butonuna bas
    const groupBBtn = screen.getByRole('button', { name: 'B Grubu' });
    fireEvent.click(groupBBtn);

    // Eczacıbaşı asla sızmamalı!
    expect(screen.queryByText(/Eczacıbaşı/i)).not.toBeInTheDocument();

    // Boş durum mesajı görünmeli
    expect(
      screen.getByText('Bu grup için puan durumu verisi henüz mevcut değil.')
    ).toBeInTheDocument();
  });

  it('(c) Düzce gibi özel grup adlandırmaları düzgün render ediliyor', () => {
    const duzceStandings = {
      'Genç Kızlar Süper Lig - Genç Kızlar İl Birinciliği': [mockItemA],
      'Genç Kızlar Süper Lig - Genç Kızlar Klasman Etabı': [mockItemB],
    };

    render(<StandingsTable standingsData={duzceStandings} />);

    // Özel grup butonları render edilmeli ve title taşımalı
    const customGroupBtn = screen.getByRole('button', { name: 'Genç Kızlar İl Birinciliği' });
    expect(customGroupBtn).toBeInTheDocument();
    expect(customGroupBtn).toHaveAttribute('title', 'Genç Kızlar İl Birinciliği');

    // Takım ve başlık doğru render edilmeli
    expect(screen.getByText(/Eczacıbaşı/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /GENÇ KIZLAR İL BİRİNCİLİĞİ/ })
    ).toBeInTheDocument();
  });

  it('(d) eşleşen takım için Volleybox profil bağlantısı ve ikonu render ediliyor', () => {
    const standingsData = {
      'Genç Kızlar Süper Lig - A Grubu': [
        { ...mockItemA, team: 'Pegasus' },
      ],
    };

    render(<StandingsTable standingsData={standingsData} />);

    expect(screen.getByText(/Pegasus/i)).toBeInTheDocument();

    // Volleybox harici linki bulunmalı
    const vbLink = screen.getByRole('link', { name: /volleybox takım profili/i });
    expect(vbLink).toBeInTheDocument();
    expect(vbLink).toHaveAttribute('href', expect.stringContaining('pegasus-spor-kulubu-u18-t54139'));
    expect(vbLink).toHaveAttribute('target', '_blank');
    expect(vbLink).toHaveAttribute('rel', 'noopener noreferrer');

    // Takım detay sayfası iç linki de bulunmalı
    const detailLink = screen.getByRole('link', { name: 'Pegasus Spor Kulübü U18' });
    expect(detailLink).toHaveAttribute('href', expect.stringContaining('/takim/pegasus'));
  });

  it('(e) eşleşmeyen takım için bağlantı ikonu render edilmiyor', () => {
    const unmappedItem: StandingItem = {
      ...mockItemA,
      team: 'Bilinmeyen Mahalle Voleybol SK',
    };

    const standingsData = {
      'Genç Kızlar Süper Lig - A Grubu': [unmappedItem],
    };

    render(<StandingsTable standingsData={standingsData} />);

    expect(screen.getByText('Bilinmeyen Mahalle Voleybol SK')).toBeInTheDocument();
    // Volleybox harici linki olmamalı
    expect(screen.queryByRole('link', { name: /volleybox/i })).not.toBeInTheDocument();
    // Takım detay sayfası iç linki bulunmalı
    const teamLink = screen.getByRole('link', { name: 'Bilinmeyen Mahalle Voleybol SK' });
    expect(teamLink).toHaveAttribute('href', '/takim/bilinmeyen-mahalle-voleybol-sk');
  });

  it('(f) lig başlığına tıklandığında Volleybox turnuva sayfasına yönlendiren link render ediliyor', () => {
    const standingsData = {
      'Genç Kızlar Süper Lig - A Grubu': [mockItemA],
    };

    render(<StandingsTable standingsData={standingsData} city="İstanbul" />);

    const leagueLink = screen.getByRole('link', { name: /GENÇ KIZLAR SÜPER LİG/i });
    expect(leagueLink).toBeInTheDocument();
    expect(leagueLink).toHaveAttribute('href', expect.stringContaining('women-stanbul-super-ligi-u18-2026-27-o50864'));
    expect(leagueLink).toHaveAttribute('target', '_blank');
  });

  it('(g) Genç ve Yıldız yaş grubu seçici butonları grupları ve verileri ayrıştırır', () => {
    const mixedStandings = {
      'Genç Kızlar Süper Lig - Genç Kızlar Süper Lig 1. Grup': [mockItemA],
      'Genç Kızlar Süper Lig - Genç Kızlar Süper Lig 2.Grup': [mockItemB],
      'Yıldız Kızlar Süper Lig - Yıldız Kızlar Süper Lig 1. Grup': [
        { ...mockItemA, team: 'VakıfBank Yıldız' },
      ],
      'Yıldız Kızlar Süper Lig - Yıldız Kızlar Süper Lig 2. Grup': [
        { ...mockItemB, team: 'Galatasaray Yıldız' },
      ],
    };

    render(<StandingsTable standingsData={mixedStandings} city="Ankara" />);

    // Kategori butonları Genç (U18) ve Yıldız (U16) görünmeli
    const gencCategoryBtn = screen.getByRole('button', { name: /Genç \(U18\)/i });
    const yildizCategoryBtn = screen.getByRole('button', { name: /Yıldız \(U16\)/i });
    expect(gencCategoryBtn).toBeInTheDocument();
    expect(yildizCategoryBtn).toBeInTheDocument();

    // Genç seçiliyken temiz "1. Grup" ve "2. Grup" butonları görünmeli
    expect(screen.getByRole('button', { name: '1. Grup' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2. Grup' })).toBeInTheDocument();
    expect(screen.getByText(/Eczacıbaşı/i)).toBeInTheDocument();
    expect(screen.queryByText(/VakıfBank Yıldız/i)).not.toBeInTheDocument();

    // Yıldız (U16) butonuna basıldığında
    fireEvent.click(yildizCategoryBtn);

    // Yıldız verisi görünmeli, Genç verisi gitmeli
    expect(screen.getByText(/VakıfBank Yıldız/i)).toBeInTheDocument();
    expect(screen.queryByText(/Eczacıbaşı/i)).not.toBeInTheDocument();

    // Yıldız 2. Grup butonuna basılınca Galatasaray Yıldız görünmeli
    const yildizGroup2Btn = screen.getByRole('button', { name: '2. Grup' });
    fireEvent.click(yildizGroup2Btn);
    expect(screen.getByText(/Galatasaray Yıldız/i)).toBeInTheDocument();
  });

  it('(h) Tüm İller modunda birden fazla il varken İL seçici butonları gösterilir ve şehirler arası geçiş yapılır', () => {
    const multiCityStandings = {
      'Ankara - Genç Kızlar Süper Lig - Genç Kızlar Süper Lig 1. Grup': [mockItemA],
      'İstanbul - Genç Kızlar Süper Lig - A Grubu': [
        { ...mockItemB, team: 'THY İstanbul' },
      ],
    };

    render(<StandingsTable standingsData={multiCityStandings} />);

    // İl butonları görünmeli
    const ankaraBtn = screen.getByRole('button', { name: 'Ankara' });
    const istanbulBtn = screen.getByRole('button', { name: 'İstanbul' });
    expect(ankaraBtn).toBeInTheDocument();
    expect(istanbulBtn).toBeInTheDocument();

    // Başlangıçta Ankara ve Eczacıbaşı aktif
    expect(screen.getByText(/Eczacıbaşı/i)).toBeInTheDocument();

    // İstanbul'a tıkla
    fireEvent.click(istanbulBtn);

    // THY İstanbul görünmeli
    expect(screen.getByText(/THY İstanbul/i)).toBeInTheDocument();
    expect(screen.queryByText(/Eczacıbaşı/i)).not.toBeInTheDocument();
  });
});


