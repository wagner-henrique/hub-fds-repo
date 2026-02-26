"use client";

import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Users, 
  Settings,
  CheckCircle2,
  XCircle,
  Trash2,
  Mail,
  Phone,
  Edit3,
  Database,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from '@/utils/toast';

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSeeding, setIsSeeding] = useState(false);
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, leadsRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/leads')
      ]);
      setBookings(await bookingsRes.json());
      setLeads(await leadsRes.json());
    } catch (error) {
      showError("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runSeed = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      if (res.ok) {
        showSuccess("Banco de dados populado!");
        fetchData();
      }
    } catch (error) {
      showError("Erro ao rodar seed.");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = activeTab === "bookings" ? `/api/bookings/${editingItem.id}` : `/api/leads/${editingItem.id}`;
    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem)
      });
      if (res.ok) {
        showSuccess("Registro atualizado!");
        setIsEditDialogOpen(false);
        fetchData();
      }
    } catch (error) {
      showError("Erro ao atualizar.");
    }
  };

  const handleDelete = async (id: string, type: 'bookings' | 'leads') => {
    if (!confirm("Deseja realmente excluir este registro?")) return;
    try {
      const res = await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess("Excluído com sucesso.");
        fetchData();
      }
    } catch (error) {
      showError("Erro ao excluir.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar ERP Style */}
      <aside className="w-72 bg-white border-r border-slate-200 p-8 flex flex-col gap-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Database size={24} />
          </div>
          <div>
            <h2 className="font-black text-xl tracking-tighter text-primary">HUB ERP</h2>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Gestão Fábrica</p>
          </div>
        </div>

        <nav className="space-y-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'bookings', icon: CalendarIcon, label: 'Agendamentos' },
            { id: 'leads', icon: Users, label: 'Leads & CRM' },
            { id: 'settings', icon: Settings, label: 'Configurações' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${
                activeTab === item.id 
                ? 'bg-primary text-white shadow-md shadow-primary/20' 
                : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
          <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">Ações Rápidas</p>
          <Button 
            onClick={runSeed} 
            disabled={isSeeding}
            variant="outline" 
            className="w-full gap-2 border-dashed border-2 hover:border-primary hover:text-primary transition-all"
          >
            <RefreshCw size={16} className={isSeeding ? 'animate-spin' : ''} />
            {isSeeding ? 'Populando...' : 'Rodar Seed'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-slate-900 capitalize mb-2">{activeTab}</h1>
            <p className="text-slate-500 font-medium">Controle total da operação do HUB FDS.</p>
          </div>
          <Button onClick={fetchData} variant="secondary" className="rounded-xl gap-2">
            <RefreshCw size={18} /> Atualizar
          </Button>
        </header>

        {activeTab === "dashboard" && (
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-4">
              <CardHeader><CardTitle className="text-slate-400 text-xs uppercase tracking-widest font-black">Agendamentos</CardTitle></CardHeader>
              <CardContent><div className="text-5xl font-black text-primary">{bookings.length}</div></CardContent>
            </Card>
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-4">
              <CardHeader><CardTitle className="text-slate-400 text-xs uppercase tracking-widest font-black">Leads Ativos</CardTitle></CardHeader>
              <CardContent><div className="text-5xl font-black text-slate-900">{leads.length}</div></CardContent>
            </Card>
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-4 bg-primary">
              <CardHeader><CardTitle className="text-white/60 text-xs uppercase tracking-widest font-black">Pendentes</CardTitle></CardHeader>
              <CardContent><div className="text-5xl font-black text-white">{bookings.filter(b => b.status === 'pending').length}</div></CardContent>
            </Card>
          </div>
        )}

        {(activeTab === "bookings" || activeTab === "leads") && (
          <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 overflow-hidden border border-slate-100">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 border-none">
                  <TableHead className="py-6 px-8 font-black text-slate-400 uppercase text-[10px] tracking-widest">Informações</TableHead>
                  <TableHead className="py-6 font-black text-slate-400 uppercase text-[10px] tracking-widest">{activeTab === "bookings" ? "Data/Hora" : "Origem"}</TableHead>
                  <TableHead className="py-6 font-black text-slate-400 uppercase text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="py-6 px-8 text-right font-black text-slate-400 uppercase text-[10px] tracking-widest">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(activeTab === "bookings" ? bookings : leads).map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                    <TableCell className="py-6 px-8">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-400 font-medium">{item.email}</div>
                    </TableCell>
                    <TableCell className="py-6">
                      {activeTab === "bookings" ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                          <span className="text-xs font-black text-primary">{item.time}</span>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="rounded-lg">{item.source}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-6">
                      <Badge className={`rounded-lg px-3 py-1 font-bold ${
                        ['confirmed', 'qualified'].includes(item.status) ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="rounded-xl hover:bg-primary hover:text-white transition-all"
                          onClick={() => { setEditingItem(item); setIsEditDialogOpen(true); }}
                        >
                          <Edit3 size={18} />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="rounded-xl text-red-500 hover:bg-red-50"
                          onClick={() => handleDelete(item.id, activeTab as any)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Modal de Edição ERP */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-900">Editar Registro</DialogTitle>
            </DialogHeader>
            {editingItem && (
              <form onSubmit={handleUpdate} className="space-y-6 py-6">
                <div className="grid gap-3">
                  <Label className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Nome Completo</Label>
                  <Input className="rounded-2xl py-6 border-slate-200" value={editingItem.name || ""} onChange={(e) => setEditingItem({...editingItem, name: e.target.value})} />
                </div>
                <div className="grid gap-3">
                  <Label className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">E-mail de Contato</Label>
                  <Input className="rounded-2xl py-6 border-slate-200" value={editingItem.email || ""} onChange={(e) => setEditingItem({...editingItem, email: e.target.value})} />
                </div>
                <div className="grid gap-3">
                  <Label className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Status Operacional</Label>
                  <Select value={editingItem.status} onValueChange={(val) => setEditingItem({...editingItem, status: val})}>
                    <SelectTrigger className="rounded-2xl py-6 border-slate-200">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {activeTab === "bookings" ? (
                        <>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="confirmed">Confirmado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="new">Novo Lead</SelectItem>
                          <SelectItem value="contacted">Em Contato</SelectItem>
                          <SelectItem value="qualified">Qualificado</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="pt-6">
                  <Button type="submit" className="w-full py-8 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20">Salvar Alterações</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminDashboard;