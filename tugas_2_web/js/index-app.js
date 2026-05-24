// js/index-app.js

var app = new Vue({
  el: '#app',
  data() {
    // Initial static mock data fallbacks
    const upbjjList = ["Jakarta", "Surabaya", "Makassar", "Padang", "Denpasar"];
    const kategoriList = ["MK Wajib", "MK Pilihan", "Praktikum", "Problem-Based"];
    const pengirimanList = [
      { kode: "REG", nama: "Reguler (3-5 hari)" },
      { kode: "EXP", nama: "Ekspres (1-2 hari)" }
    ];
    const paket = [
      { kode: "PAKET-UT-001", nama: "PAKET IPS Dasar", isi: ["EKMA4116","EKMA4115"], harga: 120000 },
      { kode: "PAKET-UT-002", nama: "PAKET IPA Dasar", isi: ["BIOL4201","FISIP4001"], harga: 140000 }
    ];
    const initialStok = [
      {
        kode: "EKMA4116",
        judul: "Pengantar Manajemen",
        kategori: "MK Wajib",
        upbjj: "Jakarta",
        lokasiRak: "R1-A3",
        harga: 65000,
        qty: 28,
        safety: 20,
        catatanHTML: "<em>Edisi 2024, cetak ulang</em>"
      },
      {
        kode: "EKMA4115",
        judul: "Pengantar Akuntansi",
        kategori: "MK Wajib",
        upbjj: "Jakarta",
        lokasiRak: "R1-A4",
        harga: 60000,
        qty: 7,
        safety: 15,
        catatanHTML: "<strong>Cover baru</strong>"
      },
      {
        kode: "BIOL4201",
        judul: "Biologi Umum (Praktikum)",
        kategori: "Praktikum",
        upbjj: "Surabaya",
        lokasiRak: "R3-B2",
        harga: 80000,
        qty: 12,
        safety: 10,
        catatanHTML: "Butuh <u>pendingin</u> untuk kit basah"
      },
      {
        kode: "FISIP4001",
        judul: "Dasar-Dasar Sosiologi",
        kategori: "MK Pilihan",
        upbjj: "Makassar",
        lokasiRak: "R2-C1",
        harga: 55000,
        qty: 2,
        safety: 8,
        catatanHTML: "Stok <i>menipis</i>, prioritaskan reorder"
      }
    ];
    const initialTracking = {
      "DO2025-0001": {
        nim: "123456789",
        nama: "Rina Wulandari",
        status: "Dalam Perjalanan",
        ekspedisi: "JNE",
        tanggalKirim: "2025-08-25",
        paket: "PAKET-UT-001",
        total: 120000,
        perjalanan: [
          { waktu: "2025-08-25 10:12:20", keterangan: "Penerimaan di Loket: TANGSEL" },
          { waktu: "2025-08-25 14:07:56", keterangan: "Tiba di Hub: JAKSEL" },
          { waktu: "2025-08-26 08:44:01", keterangan: "Diteruskan ke Kantor Tujuan" }
        ]
      }
    };

    // Load states independently
    const currentStok = JSON.parse(localStorage.getItem('sitta_stok_data')) || initialStok;
    const currentTracking = JSON.parse(localStorage.getItem('sitta_tracking_data')) || initialTracking;

    return {
      upbjjList: upbjjList,
      kategoriList: kategoriList,
      pengirimanList: pengirimanList,
      paket: paket,
      stok: currentStok,
      tracking: currentTracking,

      // App configurations & toggles
      darkMode: localStorage.getItem('darkMode') === 'true',
      showSidebar: false,
      toast: {
        show: false,
        message: '',
        type: 'success'
      },

      // Search DO
      searchQuery: '',
      searchResult: null,
      searchError: '',

      // Add Material Modal
      showAddModal: false,
      newBook: {
        kode: '',
        judul: '',
        kategori: '',
        upbjj: '',
        qty: 0,
        safety: 0,
        lokasiRak: '',
        harga: 0,
        catatanHTML: ''
      }
    };
  },
  computed: {
    totalStok() {
      return this.stok.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    },
    activeDO() {
      return Object.values(this.tracking).filter(item => item.status === 'Dalam Perjalanan').length;
    },
    laporanMasuk() {
      return this.stok.filter(item => (Number(item.qty) || 0) < (Number(item.safety) || 0)).length;
    },
    recentDeliveries() {
      const list = Object.keys(this.tracking).map(key => ({
        id: key,
        ...this.tracking[key]
      }));
      return list.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);
    },
    topStok() {
      return this.stok.slice(0, 5);
    }
  },
  methods: {
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', this.darkMode);
      if (this.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    showToast(message, type = 'success') {
      this.toast.message = message;
      this.toast.type = type;
      this.toast.show = true;
      setTimeout(() => {
        this.toast.show = false;
      }, 3000);
    },
    searchDO() {
      this.searchResult = null;
      this.searchError = '';
      if (!this.searchQuery) return;
      const query = this.searchQuery.trim().toUpperCase();
      if (this.tracking[query]) {
        this.searchResult = {
          id: query,
          ...this.tracking[query]
        };
      } else {
        this.searchError = `Nomor DO "${query}" tidak ditemukan.`;
      }
    },
    getExpeditionName(code) {
      const exp = this.pengirimanList.find(e => e.kode === code);
      return exp ? exp.nama : code;
    },
    getPackageName(code) {
      const pkg = this.paket.find(p => p.kode === code);
      return pkg ? pkg.nama : code;
    },
    submitQuickAdd() {
      const bookCode = this.newBook.kode.trim().toUpperCase();
      if (!bookCode || !this.newBook.judul.trim() || !this.newBook.kategori || !this.newBook.upbjj || !this.newBook.lokasiRak.trim()) {
        this.showToast('Semua field wajib diisi!', 'error');
        return;
      }

      const exists = this.stok.some(b => b.kode.toUpperCase() === bookCode);
      if (exists) {
        this.showToast(`Bahan ajar dengan kode "${bookCode}" sudah terdaftar!`, 'error');
        return;
      }

      const book = {
        kode: bookCode,
        judul: this.newBook.judul.trim(),
        kategori: this.newBook.kategori,
        upbjj: this.newBook.upbjj,
        lokasiRak: this.newBook.lokasiRak.trim().toUpperCase(),
        harga: Number(this.newBook.harga) || 0,
        qty: Number(this.newBook.qty) || 0,
        safety: Number(this.newBook.safety) || 0,
        catatanHTML: this.newBook.catatanHTML.trim()
      };

      this.stok.push(book);
      localStorage.setItem('sitta_stok_data', JSON.stringify(this.stok));
      this.showToast(`Bahan ajar "${book.judul}" berhasil ditambahkan!`, 'success');
      this.showAddModal = false;

      this.newBook = {
        kode: '',
        judul: '',
        kategori: '',
        upbjj: '',
        qty: 0,
        safety: 0,
        lokasiRak: '',
        harga: 0,
        catatanHTML: ''
      };
    }
  },
  mounted() {
    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
});
