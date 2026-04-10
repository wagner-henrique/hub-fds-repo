"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import BookingForm from './BookingForm';

interface BookingDialogProps {
  children: React.ReactNode;
  initialRoomId?: string;
}

const BookingDialog = ({ children, initialRoomId }: BookingDialogProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] rounded-[1.75rem] p-5 overflow-y-auto max-h-[92vh] sm:max-w-[600px] sm:rounded-[2.5rem] sm:p-8">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold text-primary sm:text-3xl">Agende sua Visita</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Escolha o melhor momento para conhecer o HUB FDS.
          </DialogDescription>
        </DialogHeader>
        <BookingForm initialRoomId={initialRoomId} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;