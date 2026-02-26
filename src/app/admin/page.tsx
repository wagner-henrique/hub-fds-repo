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
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from '@/utils/toast';

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Estados para edição
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, leadsRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/leads')
      ]);
      const bookingsData = await bookingsRes.json();
      const leadsData = await leadsRes.json();
      setBookings(bookingsData);
      setLeads(leadsData);
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
        showSuccess("Atualizado com sucesso!");
        setIsEditDialogOpen(false);
        fetchData();
      }
    } catch (error) {
      showError("Erro ao atualizar.");
    }
  };

  const handleDelete = async (id: string, type: 'bookings' | 'leads') => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    try {
      const res = await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess("Removido com sucesso.");
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
          <Button 
            variant={activeTab === "dashboard" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3"
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard size={20} /> Dashboard
          </Button>
          <Button 
            variant={activeTab === "bookings" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3"
            onClick={() => setActiveTab("bookings")}
          >
            <CalendarIcon size={20} /> Agendamentos
          </Button>
          <Button 
            variant={activeTab === "leads" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3"
            onClick={() => setActiveTab("leads")}
          >
            <Users size={20} /> Leads
          </Button>
          <Button 
            variant={activeTab === "settings" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3 mt-auto"
            onClick={() => setActiveTab("settings")}
          >
            <Settings size={20} /> Configurações
          </Button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold capitalize">{activeTab}</h1>
            <p className="text-muted-foreground">Gerenciamento do HUB FDS.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchData} variant="outline">Atualizar</Button>
          </div>
        </header>

        {activeTab === "dashboard" && (
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <Card className="bg-primary text-white">
              <CardHeader><CardTitle className="text-sm opacity-80">Agendamentos</CardTitle></CardHeader>
              <CardContent><div className="text-4xl font-bold">{bookings.length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm text-muted-foreground">Leads Ativos</CardTitle></CardHeader>
              <CardContent><div className="text-4xl font-bold text-primary">{leads.length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm text-muted-foreground">Pendentes</CardTitle></CardHeader>
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
                    <TableHead>Nome / Contato</TableHead>
                    <TableHead>{activeTab === "bookings" ? "Data/Hora" : "Origem"}</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(activeTab === "bookings" ? bookings : leads).map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.email}</div>
                      </TableCell>
                      <TableCell>
                        {activeTab === "bookings" ? (
                          <>
                            <div>{new Date(item.date).toLocaleDateString('pt-BR')}</div>
                            <div className="text-xs font-bold text-primary">{item.time}</div>
                          </>
                        ) : (
                          <Badge variant="outline">{item.source}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={item.status === 'confirmed' || item.status === 'qualified' ? 'bg-green-500' : 'bg-orange-500'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => { setEditingItem(item); setIsEditDialogOpen(true); }}>
                            <Edit3 size={18} />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-red-600" onClick={() => handleDelete(item.id, activeTab as any)}>
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

        {/* Modal de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar {activeTab === "bookings" ? "Agendamento" : "Lead"}</DialogTitle>
            </DialogHeader>
            {editingItem && (
              <form onSubmit={handleUpdate} className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" value={editingItem.name || ""} onChange={(e) => setEditingItem({...editingItem, name: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" value={editingItem.email || ""} onChange={(e) => setEditingItem({...editingItem, email: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={editingItem.status} onValueChange={(val) => setEditingItem({...editingItem, status: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
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
                <DialogFooter>
                  <Button type="submit">Salvar Alterações</Button>
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