import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { ResourceManager } from "../components/ResourceManager";
import { Toast } from "../components/Toast";
import { Icon } from "../components/Icons";
import "./pages.css";

export default function Settings() {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const closeToast = useCallback(() => setToast(""), []);

  async function loadAll() {
    setLoading(true); setError("");
    try {
      const [categoryData, locationData, unitData] = await Promise.all([api.get("/categories"), api.get("/locations"), api.get("/units")]);
      setCategories(categoryData); setLocations(locationData); setUnits(unitData);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadAll(); }, []);

  if (loading) return <p className="empty-state">Carregando configurações...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-copy"><h1>Configurações</h1><p>Personalize as listas usadas no cadastro e na organização dos itens de estoque.</p></div>
      </div>
      {error && <p className="negative-note"><Icon name="alert" size={17} />{error}</p>}
      <div className="settings-columns">
        <ResourceManager title="Categorias" resource="categories" items={categories} onChange={loadAll} onSuccess={setToast} icon="box" />
        <ResourceManager title="Locais de armazenamento" resource="locations" items={locations} onChange={loadAll} onSuccess={setToast} icon="inbox" />
        <ResourceManager title="Unidades de medida" resource="units" items={units} onChange={loadAll} onSuccess={setToast} icon="movements" />
      </div>
      {toast && <Toast message={toast} onClose={closeToast} />}
    </div>
  );
}
