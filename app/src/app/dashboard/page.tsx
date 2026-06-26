"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Quote = {
  id: number;
  quote: string;
  author: string;
};

type FormState = {
  quote: string;
  author: string;
};

type FormErrors = {
  quote?: string;
  author?: string;
};

const STORAGE_KEY = "quotes";
const AUTHORS_KEY = "authors";

export default function DashboardPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [form, setForm] = useState<FormState>({ quote: "", author: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [userName, setUserName] = useState("");

  // Verifica se está logado
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      router.push("/auth");
      return;
    }
    const user = JSON.parse(raw);
    setUserName(user.firstName ?? user.username);
  }, [router]);

  // Carrega quotes (localStorage ou API)
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      setQuotes(JSON.parse(cached));
      setLoading(false);
      return;
    }

    fetch("https://dummyjson.com/quotes?limit=20")
      .then((res) => res.json())
      .then((data) => {
        setQuotes(data.quotes);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.quotes));

        // Armazena autores únicos
        const uniqueAuthors: string[] = Array.from(
          new Set(data.quotes.map((q: Quote) => q.author))
        );
        setAuthors(uniqueAuthors);
        localStorage.setItem(AUTHORS_KEY, JSON.stringify(uniqueAuthors));
      })
      .finally(() => setLoading(false));
  }, []);

  // Carrega autores do localStorage
  useEffect(() => {
    const cached = localStorage.getItem(AUTHORS_KEY);
    if (cached) setAuthors(JSON.parse(cached));
  }, []);

  function saveQuotes(updated: Quote[]) {
    setQuotes(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function saveAuthors(newAuthor: string) {
    if (!authors.includes(newAuthor)) {
      const updated = [...authors, newAuthor];
      setAuthors(updated);
      localStorage.setItem(AUTHORS_KEY, JSON.stringify(updated));
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!form.quote.trim()) newErrors.quote = "A frase não pode estar vazia.";
    if (!form.author.trim()) newErrors.author = "O autor não pode estar vazio.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function openCreate() {
    setEditingQuote(null);
    setForm({ quote: "", author: "" });
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(q: Quote) {
    setEditingQuote(q);
    setForm({ quote: q.quote, author: q.author });
    setErrors({});
    setDialogOpen(true);
  }

  function handleSave() {
    if (!validate()) return;

    if (editingQuote) {
      // Atualizar
      const updated = quotes.map((q) =>
        q.id === editingQuote.id ? { ...q, ...form } : q
      );
      saveQuotes(updated);
    } else {
      // Criar
      const newQuote: Quote = {
        id: Date.now(),
        quote: form.quote,
        author: form.author,
      };
      saveQuotes([newQuote, ...quotes]);
    }

    saveAuthors(form.author);
    setDialogOpen(false);
  }

  function handleDelete(id: number) {
    const updated = quotes.filter((q) => q.id !== id);
    saveQuotes(updated);
  }

  function handleLogout() {
    localStorage.removeItem("user");
    document.cookie = "user=; path=/; max-age=0";
    router.push("/auth");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white dark:bg-zinc-900 border-b">
        <h1 className="text-xl font-semibold">Frases Célebres</h1>
        <div className="flex items-center gap-4">
          {userName && (
            <span className="text-sm text-zinc-500">Olá, {userName}!</span>
          )}
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <p className="text-zinc-500 text-sm">{quotes.length} frases</p>
          <Button onClick={openCreate}>+ Nova frase</Button>
        </div>

        {loading && <p className="text-center text-zinc-400">Carregando...</p>}

        {/* Lista de quotes */}
        {quotes.map((q) => (
          <Card key={q.id}>
            <CardContent className="pt-6 flex flex-col gap-3">
              <p className="text-zinc-800 dark:text-zinc-100 italic">
                "{q.quote}"
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{q.author}</Badge>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(q)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(q.id)}
                  >
                    Apagar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </main>

      {/* Dialog de criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingQuote ? "Editar frase" : "Nova frase"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="quote">Frase</Label>
              <Input
                id="quote"
                placeholder="Digite a frase..."
                value={form.quote}
                onChange={(e) => setForm({ ...form, quote: e.target.value })}
              />
              {errors.quote && (
                <p className="text-xs text-red-500">{errors.quote}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="author">Autor</Label>
              <Input
                id="author"
                placeholder="Nome do autor..."
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                list="authors-list"
              />
              {/* Sugestões de autores salvos */}
              <datalist id="authors-list">
                {authors.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
              {errors.author && (
                <p className="text-xs text-red-500">{errors.author}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingQuote ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}