// js/stok-app.js

var app = new Vue({
  el: '#app',
  data() {
    // Initial static mock data
    const upbjjList = ["Jakarta", "Surabaya", "Makassar", "Padang", "Denpasar"];
    const kategoriList = ["MK Wajib", "MK Pilihan", "Praktikum", "Problem-Based"];
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

    // Load from local storage if exists, otherwise initialize
    if (!localStorage.getItem('sitta_stok_data')) {
      localStorage.setItem('sitta_stok_data', JSON.stringify(initialStok));
    }
    const currentStok = JSON.parse(localStorage.getItem('sitta_stok_data'));

    return {
      upbjjList: upbjjList,
      kategoriList: kategoriList,
      stok: currentStok,

      // App configurations & toggles
      darkMode: localStorage.getItem('darkMode') === 'true',
      showSidebar: false,
      toast: {
        show: false,
        message: '',
        type: 'success'
      },

      // Filter and Sort states
      searchQuery: '',
      selectedUpbjj: '',
      selectedKategori: '',
      sortBy: 'judul', // 'judul', 'stock', 'harga'
      sortOrder: 'asc', // 'asc', 'desc'
      showLowStockOnly: false,

      // Add/Edit Form states
      showFormModal: false,
      isEditMode: false,
      formBook: {
        kode: '',
        judul: '',
        kategori: '',
        upbjj: '',
        lokasiRak: '',
        harga: 0,
        qty: 0,
        safety: 0,
        catatanHTML: ''
      }
    };
  },
  computed: {
    filteredStok() {
      let result = [...this.stok];

      // 1. Text Search Filter (Case-insensitive match on kode or judul)
      if (this.searchQuery) {
        const query = this.searchQuery.trim().toLowerCase();
        result = result.filter(item => 
          item.kode.toLowerCase().includes(query) || 
          item.judul.toLowerCase().includes(query)
        );
      }

      // 2. UT-Daerah Filter
      if (this.selectedUpbjj) {
        result = result.filter(item => item.upbjj === this.selectedUpbjj);

        // 3. Dependent Kategori Filter (Only active if UT-Daerah is selected)
        if (this.selectedKategori) {
          result = result.filter(item => item.kategori === this.selectedKategori);
        }
      }

      // 4. Safety / Low Stock Filter (qty < safety OR qty === 0)
      if (this.showLowStockOnly) {
        result = result.filter(item => 
          (Number(item.qty) || 0) < (Number(item.safety) || 0) || 
          (Number(item.qty) || 0) === 0
        );
      }

      // 5. Sorting
      result.sort((a, b) => {
        let fieldA, fieldB;

        if (this.sortBy === 'stock') {
          fieldA = Number(a.qty) || 0;
          fieldB = Number(b.qty) || 0;
        } else if (this.sortBy === 'harga') {
          fieldA = Number(a.harga) || 0;
          fieldB = Number(b.harga) || 0;
        } else {
          // Default sorting by 'judul' (alphabetical)
          fieldA = (a.judul || '').toString().toLowerCase();
          fieldB = (b.judul || '').toString().toLowerCase();
        }

        if (fieldA < fieldB) return this.sortOrder === 'asc' ? -1 : 1;
        if (fieldA > fieldB) return this.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      return result;
    }
  },
  watch: {
    selectedUpbjj(newVal) {
      // Reset dependent kategori filter if primary region changes
      this.selectedKategori = '';
    },
    stok: {
      deep: true,
      handler(newVal) {
        // Automatically save to local storage
        localStorage.setItem('sitta_stok_data', JSON.stringify(newVal));
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
    resetFilters() {
      this.searchQuery = '';
      this.selectedUpbjj = '';
      this.selectedKategori = '';
      this.sortBy = 'judul';
      this.sortOrder = 'asc';
      this.showLowStockOnly = false;
      this.showToast('Filter pencarian telah di-reset', 'info');
    },
    toggleSort(field) {
      if (this.sortBy === field) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortBy = field;
        this.sortOrder = 'asc';
      }
    },
    openAddModal() {
      this.isEditMode = false;
      this.formBook = {
        kode: '',
        judul: '',
        kategori: '',
        upbjj: '',
        lokasiRak: '',
        harga: 0,
        qty: 0,
        safety: 0,
        catatanHTML: ''
      };
      this.showFormModal = true;
    },
    closeFormModal() {
      this.showFormModal = false;
    },
    editBook(book) {
      this.isEditMode = true;
      // Copy current properties into form state
      this.formBook = { ...book };
      this.showFormModal = true;
    },
    deleteBook(book) {
      if (confirm(`Apakah Anda yakin ingin menghapus bahan ajar "${book.judul}" (${book.kode})?`)) {
        const idx = this.stok.findIndex(b => b.kode === book.kode);
        if (idx !== -1) {
          this.stok.splice(idx, 1);
          localStorage.setItem('sitta_stok_data', JSON.stringify(this.stok));
          this.showToast(`Bahan ajar "${book.judul}" berhasil dihapus`, 'success');
        }
      }
    },
    saveBook() {
      const bookCode = this.formBook.kode.trim().toUpperCase();
      if (!bookCode || !this.formBook.judul.trim() || !this.formBook.kategori || !this.formBook.upbjj || !this.formBook.lokasiRak.trim()) {
        this.showToast('Semua kolom bertanda * wajib diisi!', 'error');
        return;
      }

      if (this.isEditMode) {
        // Edit Mode: update existing book
        const idx = this.stok.findIndex(b => b.kode === bookCode);
        if (idx !== -1) {
          // Update properties reactively
          Vue.set(this.stok, idx, {
            kode: bookCode,
            judul: this.formBook.judul.trim(),
            kategori: this.formBook.kategori,
            upbjj: this.formBook.upbjj,
            lokasiRak: this.formBook.lokasiRak.trim().toUpperCase(),
            harga: Number(this.formBook.harga) || 0,
            qty: Number(this.formBook.qty) || 0,
            safety: Number(this.formBook.safety) || 0,
            catatanHTML: this.formBook.catatanHTML.trim()
          });
          this.showToast(`Bahan ajar "${this.formBook.judul}" berhasil diperbarui`, 'success');
        }
      } else {
        // Add Mode: validate duplicates and insert
        const exists = this.stok.some(b => b.kode.toUpperCase() === bookCode);
        if (exists) {
          this.showToast(`Bahan ajar dengan kode "${bookCode}" sudah terdaftar!`, 'error');
          return;
        }

        const newBook = {
          kode: bookCode,
          judul: this.formBook.judul.trim(),
          kategori: this.formBook.kategori,
          upbjj: this.formBook.upbjj,
          lokasiRak: this.formBook.lokasiRak.trim().toUpperCase(),
          harga: Number(this.formBook.harga) || 0,
          qty: Number(this.formBook.qty) || 0,
          safety: Number(this.formBook.safety) || 0,
          catatanHTML: this.formBook.catatanHTML.trim()
        };

        this.stok.push(newBook);
        this.showToast(`Bahan ajar "${newBook.judul}" berhasil disimpan`, 'success');
      }

      // Commit changes and close
      localStorage.setItem('sitta_stok_data', JSON.stringify(this.stok));
      this.showFormModal = false;
    }
  },
  mounted() {
    // Sync theme setting
    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
});
