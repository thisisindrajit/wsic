"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Copy,
  Facebook,
  Linkedin,
  MessageCircle,
  Send,
  Twitter,
} from "lucide-react";
import { shareToNative, shareToClipboard, shareToSocial, ShareOptions } from "@/lib/share";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareOptions: ShareOptions;
  onShare?: (platform: string) => void;
}

export function ShareDialog({ open, onOpenChange, shareOptions, onShare }: ShareDialogProps) {
  const [copying, setCopying] = useState(false);

  const handleNativeShare = async () => {
    const success = await shareToNative(shareOptions);
    if (success) {
      onShare?.("native");
      onOpenChange(false);
    }
  };

  const handleCopyLink = async () => {
    setCopying(true);
    const success = await shareToClipboard(shareOptions.url);
    setCopying(false);

    if (success) {
      toast.success("Link copied to clipboard!");
      onShare?.("clipboard");
    } else {
      toast.error("Failed to copy link");
    }
  };

  const handleSocialShare = (platform: string) => {
    const success = shareToSocial(platform, shareOptions);
    if (success) {
      onShare?.(platform);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Topic</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Native Share (if supported) */}
          <Button
            onClick={handleNativeShare}
            className="w-full"
            variant="outline"
          >
            <Send className="w-4 h-4 mr-2" />
            Share
          </Button>

          {/* Copy Link */}
          <div className="flex items-center space-x-2">
            <Input
              value={shareOptions.url}
              readOnly
              className="flex-1"
            />
            <Button
              onClick={handleCopyLink}
              disabled={copying}
              variant="outline"
              size="icon"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          {/* Social Media Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleSocialShare("twitter")}
              variant="outline"
              className="w-full"
            >
              <Twitter className="w-4 h-4 mr-2" />
              Twitter
            </Button>

            <Button
              onClick={() => handleSocialShare("facebook")}
              variant="outline"
              className="w-full"
            >
              <Facebook className="w-4 h-4 mr-2" />
              Facebook
            </Button>

            <Button
              onClick={() => handleSocialShare("linkedin")}
              variant="outline"
              className="w-full"
            >
              <Linkedin className="w-4 h-4 mr-2" />
              LinkedIn
            </Button>

            <Button
              onClick={() => handleSocialShare("whatsapp")}
              variant="outline"
              className="w-full"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}