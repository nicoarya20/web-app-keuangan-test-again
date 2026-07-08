export const APP_VERSION = '1.2.0';

export interface ChangelogEntry {
  version: string;
  date: string;
  features: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.2.0',
    date: '8 Jul 2026',
    features: [
      'Tambah tombol sembunyikan/tampilkan nominal uang (icon mata di Topbar)',
      'Preferensi tersimpan otomatis — tidak perlu atur ulang setiap buka aplikasi',
    ],
  },
  {
    version: '1.1.0',
    date: '8 Jul 2026',
    features: [
      'Pemasukan otomatis menambah saldo dompet saat wallet dipilih',
      'Pengeluaran otomatis mengurangi saldo dompet saat wallet dipilih',
      'Hapus transaksi dompet ikut menghapus income/expense terkait',
    ],
  },
];
