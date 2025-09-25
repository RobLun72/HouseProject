import type { AlertDialogProps } from "@radix-ui/react-alert-dialog";
import { useId } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import cn from "@/helpers/cn";

export interface ConfirmDialogProps extends AlertDialogProps {
  className?: string;
  title: string;
  description: string;
  isOpen?: boolean;
  onCancel?: () => void;
  onOk?: () => void;
  noOkButton?: boolean;
  cancelText?: string;
  okText?: string;
}
export function ConfirmDialog({
  className,
  title,
  description,
  isOpen,
  onCancel,
  onOk,
  noOkButton,
  cancelText = "Cancel",
  okText = "Continue",
  ...otherProps
}: ConfirmDialogProps) {
  const id = useId();

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent id={id} className={cn("", className)} {...otherProps}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-800">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {onCancel && (
            <AlertDialogCancel onClick={onCancel}>
              {cancelText}
            </AlertDialogCancel>
          )}
          {onOk && !noOkButton && (
            <AlertDialogAction className="bg-app-primary" onClick={onOk}>
              {okText}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
