import React, { useState, useEffect } from "react";
import { Plus, Upload, Calendar, Clock, PackageSearch } from "lucide-react";
import * as api from "@/services/api";

export default function ProjectsTab() {
  const [projects, setProjects] = useState<any[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", startDate: "", endDate: "", status: "PLANNING" });
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [newItem, setNewItem] = useState({ itemName: "", quantity: 1, notes: "" });

  useEffect(() => {
    setRole(localStorage.getItem("role"));
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProject({ ...formData, isProject: true });
      setIsCreating(false);
      setFormData({ name: "", description: "", startDate: "", endDate: "", status: "PLANNING" });
      loadProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = async (projectId: number, e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addProjectItem(projectId, newItem);
      setNewItem({ itemName: "", quantity: 1, notes: "" });
      setSelectedProject(null);
      loadProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadImage = async (projectId: number, file: File) => {
    try {
      await api.uploadProjectImage(projectId, file);
      loadProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const canEdit = role === "ADMIN" || role === "INVENTORY_MANAGER";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <PackageSearch className="w-6 h-6 text-brand-500" />
          Projects & Bulk Orders
        </h2>
        {canEdit && (
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {isCreating && canEdit && (
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
          <form onSubmit={handleCreateProject} className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Project Name" className="glass-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            <select className="glass-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
              <option value="PLANNING">Planning</option>
              <option value="IN PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <input type="date" className="glass-input" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
            <input type="date" className="glass-input" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
            <textarea placeholder="Description" className="glass-input col-span-2" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            <div className="col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setIsCreating(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Create</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.filter(p => p.isProject).map((project) => (
          <div key={project.id} className="glass-panel overflow-hidden flex flex-col">
            {project.imageUrl ? (
              <img src={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '')}${project.imageUrl}`} alt={project.name} className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                No Image Available
              </div>
            )}
            
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{project.name}</h3>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                  {project.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex-1">{project.description}</p>
              
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Start: {project.startDate || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>End: {project.endDate || "N/A"}</span>
                </div>
              </div>

              <div className="mt-auto border-t border-slate-200 dark:border-slate-700 pt-4">
                <h4 className="font-medium text-sm mb-2 text-slate-700 dark:text-slate-200">Bulk Orders ({project.items?.length || 0})</h4>
                <ul className="text-sm space-y-1 mb-4">
                  {[...(project.items || [])].sort((a: any, b: any) => a.itemName.localeCompare(b.itemName)).map((item: any) => (
                    <li key={item.id} className="flex justify-between text-slate-500">
                      <span>{item.quantity}x {item.itemName}</span>
                    </li>
                  ))}
                </ul>

                {canEdit && (
                  <div className="flex flex-col gap-2 mt-2">
                    {selectedProject === project.id ? (
                      <form onSubmit={(e) => handleAddItem(project.id, e)} className="flex flex-col gap-2">
                        <input type="text" placeholder="Item Name" className="glass-input text-sm" value={newItem.itemName} onChange={e => setNewItem({ ...newItem, itemName: e.target.value })} required />
                        <div className="flex gap-2">
                          <input type="number" min="1" className="glass-input text-sm w-20" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })} required />
                          <button type="submit" className="btn-primary flex-1 text-sm">Add</button>
                        </div>
                      </form>
                    ) : (
                      <button onClick={() => setSelectedProject(project.id)} className="btn-secondary text-sm py-1">Add Items</button>
                    )}
                    
                    <label className="btn-secondary text-sm py-1 cursor-pointer flex items-center justify-center gap-2">
                      <Upload className="w-3 h-3" /> Upload Image
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        if (e.target.files?.[0]) handleUploadImage(project.id, e.target.files[0]);
                      }} />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
