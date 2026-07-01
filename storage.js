/* =========================================================
   COFRE — storage.js
   Camada de persistência usando localStorage.
   ========================================================= */

const STORAGE_KEY = 'cofre_data_v1';

const DEFAULT_CATEGORIES = [
  'Alimentação', 'Moradia', 'Transporte', 'Saúde',
  'Lazer', 'Educação', 'Compras', 'Assinaturas', 'Outros'
];

function getDefaultData() {
  return {
    transactions: [],   // { id, type: 'income'|'expense', desc, value, category, date }
    investments: [],    // { id, name, type, value, date }
    goals: [],          // { id, name, target, current }
    config: {
      expectedIncome: 0,
      reservePercent: 10
    }
  };
}

const Storage = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultData();
      const parsed = JSON.parse(raw);
      // garante estrutura completa mesmo se algo faltar
      return { ...getDefaultData(), ...parsed };
    } catch (e) {
      console.error('Erro ao carregar dados do Cofre:', e);
      return getDefaultData();
    }
  },

  save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Erro ao salvar dados do Cofre:', e);
    }
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },

  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
};
