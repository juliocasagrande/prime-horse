import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { ResourceManager } from "../components/ResourceManager";
import "./pages.css";

export default function Settings() {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    const [c, l, u] = await Promise.all([api.get("/categories"), api.get("/locations"), api.get("/units")]);
    setCategories(c);
    setLocations(l);
    setUnits(u);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  if (loading) return <p className="empty-state">Carregando configurações...</p>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Configurações</h1>
          <p>
            Categorias, locais e unidades de medida são listas abertas — adicione quantas precisar. A
            quantidade mínima de alerta é definida individualmente em cada item, na tela "Itens de estoque".
          </p>
        </div>
      </div>

      <div className="settings-columns">
        <ResourceManager title="Categorias" resource="categories" items={categories} onChange={loadAll} />
        <ResourceManager title="Locais de armazenamento" resource="locations" items={locations} onChange={loadAll} />
        <ResourceManager title="Unidades de medida" resource="units" items={units} onChange={loadAll} />
      </div>
    </div>
  );
}
