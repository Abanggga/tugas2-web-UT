// js/tracking-app.js

var app = new Vue({
  el: '#app',
  data() {
    // Initial static mock data
    const upbjjList = ["Jakarta", "Surabaya", "Makassar", "Padang", "Denpasar"];
    const pengirimanList = [
      { kode: "REG", nama: "Reguler (3-5 hari)" },
      { kode: "EXP", nama: "Ekspres (1-2 hari)" }
    ];
    const paket = [
      { kode: "PAKET-UT-001", nama: "PAKET IPS Dasar", isi: ["EKMA4116","EKMA4115"], harga: 120000 },
      { kode: "PAKET-UT-002", nama: "PAKET IPA Dasar", isi: ["BIOL4201","FISIP4001"], harga: 140000 }
    ];
    const stok = [
      { kode: "EKMA4116", judul: "Pengantar Manajemen" },
      { kode: "EKMA4115", judul: "Pengantar Akuntansi" },
      { kode: "BIOL4201", judul: "Biologi Umum (Praktikum)" },
      { kode: "FISIP4001", judul: "Dasar-Dasar Sosiologi" }
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

    // Load from local storage if exists, otherwise initialize
    if (!localStorage.getItem('sitta_tracking_data')) {
      localStorage.setItem('sitta_tracking_data', JSON.stringify(initialTracking));
    }
    const currentTracking = JSON.parse(localStorage.getItem('sitta_tracking_data'));

    return {
      upbjjList: upbjjList,
      pengirimanList: pengirimanList,
      paket: paket,
      stok: stok,
      tracking: currentTracking,

      // App configurations & toggles
      darkMode: localStorage.getItem('darkMode') === 'true',
      showSidebar: false,
      toast: {
        show: false,
        message: '',
        type: 'success'
      },

      // Form registration state
      formDo: {
        nim: '',
        nama: '',
        ekspedisi: '',
        paket: '',
        tanggalKirim: new Date().toISOString().substring(0, 10),
        total: 0
      },

      // Timeline view state
      expandedDoId: null
    };
  },
  computed: {
    generatedDoNumber() {
      const currentYear = new Date().getFullYear();
      const prefix = `DO${currentYear}-`;
      
      const matches = Object.keys(this.tracking).filter(key => key.startsWith(prefix));
      if (matches.length > 0) {
        const nums = matches.map(key => parseInt(key.substring(prefix.length)) || 0);
        const maxNum = Math.max(...nums);
        const nextNum = maxNum + 1;
        return `${prefix}${String(nextNum).padStart(4, '0')}`;
      } else {
        return `${prefix}0001`;
      }
    },
    selectedPackageContents() {
      if (!this.formDo.paket) return [];
      const selectedPkg = this.paket.find(p => p.kode === this.formDo.paket);
      if (!selectedPkg) return [];
      
      return selectedPkg.isi.map(code => {
        const book = this.stok.find(b => b.kode === code);
        return {
          kode: code,
          judul: book ? book.judul : 'Buku / Modul Ajar'
        };
      });
    },
    trackingList() {
      const list = Object.keys(this.tracking).map(key => ({
        id: key,
        ...this.tracking[key]
      }));
      return list.sort((a, b) => b.id.localeCompare(a.id));
    }
  },
  watch: {
    'formDo.paket'(newVal) {
      if (newVal) {
        const selectedPkg = this.paket.find(p => p.kode === newVal);
        this.formDo.total = selectedPkg ? selectedPkg.harga : 0;
      } else {
        this.formDo.total = 0;
      }
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
    getExpeditionName(code) {
      const exp = this.pengirimanList.find(e => e.kode === code);
      return exp ? exp.nama : code;
    },
    toggleDetail(id) {
      if (this.expandedDoId === id) {
        this.expandedDoId = null;
      } else {
        this.expandedDoId = id;
      }
    },
    submitDO() {
      const nimPattern = /^\d{9}$/;
      if (!nimPattern.test(this.formDo.nim)) {
        this.showToast('NIM Mahasiswa harus berupa 9 digit angka!', 'error');
        return;
      }

      if (!this.formDo.nama.trim() || !this.formDo.ekspedisi || !this.formDo.paket || !this.formDo.tanggalKirim) {
        this.showToast('Mohon lengkapi semua kolom form!', 'error');
        return;
      }

      const newDoId = this.generatedDoNumber;
      const now = new Date();
      const formattedTimestamp = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0');

      const newDo = {
        nim: this.formDo.nim.trim(),
        nama: this.formDo.nama.trim(),
        status: "Dalam Perjalanan",
        ekspedisi: this.formDo.ekspedisi,
        tanggalKirim: this.formDo.tanggalKirim,
        paket: this.formDo.paket,
        total: this.formDo.total,
        perjalanan: [
          { waktu: formattedTimestamp, keterangan: "Registrasi Delivery Order (DO) Berhasil" },
          { waktu: formattedTimestamp, keterangan: "Penerimaan di Loket Gudang UT Pusat" }
        ]
      };

      Vue.set(this.tracking, newDoId, newDo);
      localStorage.setItem('sitta_tracking_data', JSON.stringify(this.tracking));

      this.showToast(`Delivery Order ${newDoId} berhasil diregistrasi!`, 'success');

      this.formDo = {
        nim: '',
        nama: '',
        ekspedisi: '',
        paket: '',
        tanggalKirim: new Date().toISOString().substring(0, 10),
        total: 0
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
