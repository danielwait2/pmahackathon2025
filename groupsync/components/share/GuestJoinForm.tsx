'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface GuestJoinFormProps {
  token: string;
  projectName: string;
  projectDescription: string | null;
  existingGuestNames: string[];
}

export function GuestJoinForm({
  token,
  projectName,
  projectDescription,
  existingGuestNames
}: GuestJoinFormProps) {
  const router = useRouter();
  const [isNewMember, setIsNewMember] = useState(existingGuestNames.length === 0);
  const [name, setName] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const guestName = isNewMember ? name : selectedName;

    if (!guestName.trim()) {
      toast.error('Please enter or select your name');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/share/${token}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: guestName })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join project');
      }

      toast.success(data.isReturning ? 'Welcome back!' : 'Successfully joined project!');

      // Store in localStorage for client-side awareness (optional)
      if (typeof window !== 'undefined') {
        localStorage.setItem(`guest_name_${data.projectId}`, guestName);
      }

      // Redirect to project page
      router.push(`/project/${data.projectId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join project');
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join {projectName}</CardTitle>
        <CardDescription>
          {projectDescription || 'Enter your name to join this project'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {existingGuestNames.length > 0 && (
            <div className="space-y-2">
              <Label>Are you returning?</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={isNewMember ? 'outline' : 'default'}
                  onClick={() => setIsNewMember(false)}
                  className="flex-1"
                >
                  Yes, I&apos;ve been here
                </Button>
                <Button
                  type="button"
                  variant={isNewMember ? 'default' : 'outline'}
                  onClick={() => setIsNewMember(true)}
                  className="flex-1"
                >
                  No, I&apos;m new
                </Button>
              </div>
            </div>
          )}

          {isNewMember ? (
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                disabled={isLoading}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="existingName">Select Your Name</Label>
              <select
                id="existingName"
                value={selectedName}
                onChange={(e) => setSelectedName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                required
                disabled={isLoading}
              >
                <option value="">-- Select your name --</option>
                {existingGuestNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground">
                Don&apos;t see your name?{' '}
                <button
                  type="button"
                  onClick={() => setIsNewMember(true)}
                  className="text-primary hover:underline"
                >
                  Enter it manually
                </button>
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Joining...' : 'Join Project'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
