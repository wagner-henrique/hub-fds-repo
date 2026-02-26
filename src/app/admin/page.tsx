"use client";

import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Users, 
  Settings,
  Trash2,
  Edit3,
  RefreshCw,
  Mail,
  Phone
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
    <div className="min-h-screen bg-secondary/10 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-primary/10 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold">H</div>
          <span className="font-bold text-xl text-primary">HUB Admin</span>
        </div>

        <nav className="space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'bookings', icon: CalendarIcon, label: 'Agendamentos' },
            { id: 'leads', icon: Users, label: 'Leads' },
            { id: 'settings', icon: Settings, label: 'Configurações' },
          ].map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 ${activeTab === item.id ? 'bg-primary/10 text-primary' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon size={20} />
              {item.label}
            </Button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold capitalize">{activeTab}</h1>
            <p className="text-muted-foreground">Gerenciamento centralizado do HUB FDS.</p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm" className="gap-2">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Atualizar
          </Button>
        </header>

        {activeTab === "dashboard" && (
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <Card className="bg-primary text-white border-none shadow-lg shadow-primary/10">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium opacity-80">Agendamentos</CardTitle></CardHeader>
              <CardContent><div className="text-4xl font-bold">{bookings.length}</div></CardContent>
            </Card>
            <Card className="border-none shadow-lg shadow-primary/5">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Leads Ativos</CardTitle></CardHeader>
              <CardContent><div className="text-4xl font-bold text-primary">{leads.length}</div></CardContent>
            </Card>
            <Card className="border-none shadow-lg shadow-primary/5">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle></CardHeader>
              <CardContent><div className="text-4xl font-bold text-orange-500">{bookings.filter(b => b.status === 'pending').length}</div></CardContent>
            </Card>
          </div>
        )}

        {(activeTab === "bookings" || activeTab === "leads") && (
          <Card className="rounded-3xl overflow-hidden border-none shadow-xl shadow-primary/5">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/20">
                    <TableHead className="py-4 px-6">Informações</TableHead>
                    <TableHead>{activeTab === "bookings" ? "Data/Hora" : "Origem"}</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right px-6">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(activeTab === "bookings" ? bookings : leads).map((item: any) => (
                    <TableRow key={item.id} className="hover:bg-secondary/5 transition-colors">
                      <TableCell className="py-4 px-6">
                        <div className="font-bold">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.email}</div>
                      </TableCell>
                      <TableCell>
                        {activeTab === "bookings" ? (
                          <div className="flex flex-col">
                            <span className="font-medium">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                            <span className="text-xs font-bold text-primary">{item.time}</span>
                          </div>
                        ) : (
                          <Badge variant="outline">{item.source}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={['confirmed', 'qualified'].includes(item.status) ? 'bg-primary' : 'bg-orange-500'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => { setEditingItem(item); setIsEditDialogOpen(true); }}>
                            <Edit3 size={18} className="text-primary" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(item.id, activeTab as any)}>
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Editar Registro</DialogTitle>
            </DialogHeader>
            {editingItem && (
              <form onSubmit={handleUpdate} className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" className="rounded-xl" value={editingItem.name || ""} onChange={(e) => setEditingItem({...editingItem, name: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" className="rounded-xl" value={editingItem.email || ""} onChange={(e) => setEditingItem({...editingItem, email: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={editingItem.status} onValueChange={(val) => setEditingItem({...editingItem, status: val})}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {activeTab === "bookings" ? (
                        <>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="confirmed">Confirmado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="new">Novo</SelectItem>
                          <SelectItem value="contacted">Contatado</SelectItem>
                          <SelectItem value="qualified">Qualificado</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full rounded-xl font-bold">Salvar Alterações</Button>
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