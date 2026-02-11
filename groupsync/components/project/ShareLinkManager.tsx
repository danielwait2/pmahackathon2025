'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Link, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareLinkManagerProps {
  projectId: string;
  initialShareToken: string | null;
}

export function ShareLinkManager({ projectId, initialShareToken }: ShareLinkManagerProps) {
  const [shareToken, setShareToken] = useState(initialShareToken);
  const [isLoading, setIsLoading] = useState(false);

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const shareUrl = shareToken ? `${baseUrl}/share/${shareToken}` : null;

  const generateLink = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/share-link`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to generate link');

      const data = await response.json();
      setShareToken(data.shareToken);
      toast.success('Share link generated!');
    } catch (error) {
      toast.error('Failed to generate share link');
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const deleteLink = async () => {
    if (!confirm('Are you sure? This will disable the current share link.')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/share-link`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete link');

      setShareToken(null);
      toast.success('Share link disabled');
    } catch (error) {
      toast.error('Failed to disable share link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Guest Share Link
        </CardTitle>
        <CardDescription>
          Allow anyone with the link to join without creating an account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {shareUrl ? (
          <>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="font-mono text-sm" />
              <Button onClick={copyLink} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={generateLink} variant="outline" disabled={isLoading} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
              <Button onClick={deleteLink} variant="destructive" disabled={isLoading}>
                <Trash2 className="mr-2 h-4 w-4" />
                Disable
              </Button>
            </div>
          </>
        ) : (
          <Button onClick={generateLink} disabled={isLoading} className="w-full">
            Generate Share Link
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
