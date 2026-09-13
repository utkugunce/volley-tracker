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

    // Başlangıçta A Grubu seçili ve Eczacıbaşı A görünmeli
    expect(screen.getByText('Eczacıbaşı A')).toBeInTheDocument();
    expect(screen.queryByText('Fenerbahçe B')).not.toBeInTheDocument();

    // B Grubu butonuna tıklanınca Fenerbahçe B görünmeli, Eczacıbaşı A gitmeli
    const groupBBtn = screen.getByRole('button', { name: 'B Grubu' });
    fireEvent.click(groupBBtn);

    expect(screen.getByText('Fenerbahçe B')).toBeInTheDocument();
    expect(screen.queryByText('Eczacıbaşı A')).not.toBeInTheDocument();
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
    expect(screen.getByText('Eczacıbaşı A')).toBeInTheDocument();

    // B Grubu butonuna bas
    const groupBBtn = screen.getByRole('button', { name: 'B Grubu' });
    fireEvent.click(groupBBtn);

    // Eczacıbaşı A asla sızmamalı!
    expect(screen.queryByText('Eczacıbaşı A')).not.toBeInTheDocument();

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
    expect(screen.getByText('Eczacıbaşı A')).toBeInTheDocument();
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

    expect(screen.getByText('Pegasus')).toBeInTheDocument();

    // Volleybox linki bulunmalı
    const link = screen.getByRole('link', { name: /pegasus/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('pegasus-spor-kulubu-u18-t54139'));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
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
    // Takım adı link olmamalı
    expect(screen.queryByRole('link', { name: /bilinmeyen/i })).not.toBeInTheDocument();
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
});

