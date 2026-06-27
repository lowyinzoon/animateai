"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CharacterImageGenerator } from "./character-image-generator";
import { CharacterImageGallery } from "./character-image-gallery";
import { Users, Pencil } from "lucide-react";
import type { Asset, CharacterMetadata } from "@/types";

interface CharacterDetailProps {
  character: Asset;
  onEdit: () => void;
  onUpdate: () => void;
}

export function CharacterDetail({
  character,
  onEdit,
  onUpdate,
}: CharacterDetailProps) {
  const meta = character.metadata as unknown as CharacterMetadata;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{character.name || "Unnamed"}</h2>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="gallery">
            Gallery
            {meta?.generatedImages?.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                {meta.generatedImages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <ProfileTab character={character} meta={meta} />
        </TabsContent>

        <TabsContent value="gallery" className="mt-4">
          <CharacterImageGallery character={character} onUpdate={onUpdate} />
        </TabsContent>

        <TabsContent value="generate" className="mt-4">
          <CharacterImageGenerator
            character={character}
            onImageGenerated={onUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileTab({
  character,
  meta,
}: {
  character: Asset;
  meta: CharacterMetadata;
}) {
  if (!meta) {
    return (
      <p className="text-sm text-muted-foreground">
        No profile data available.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-6">
        {character.file_url ? (
          <div className="h-32 w-32 rounded-xl overflow-hidden border border-border shrink-0">
            <Image
              src={character.file_url}
              alt={character.name || "Character"}
              width={128}
              height={128}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-32 w-32 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
        )}

        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap gap-2">
            {meta.species && (
              <Badge variant="secondary">{meta.species}</Badge>
            )}
            {meta.gender && (
              <Badge variant="outline">{meta.gender}</Badge>
            )}
            {meta.age && (
              <Badge variant="outline">Age: {meta.age}</Badge>
            )}
            {meta.style_preset && (
              <Badge variant="outline">
                Style: {meta.style_preset.replace(/-/g, " ")}
              </Badge>
            )}
          </div>
          {meta.description && (
            <p className="text-sm text-muted-foreground">
              {meta.description}
            </p>
          )}
        </div>
      </div>

      {meta.traits?.length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="text-sm font-medium mb-2">Traits</h4>
            <div className="flex flex-wrap gap-1.5">
              {meta.traits.map((trait) => (
                <Badge key={trait} variant="secondary">
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {meta.backstory && (
        <>
          <Separator />
          <div>
            <h4 className="text-sm font-medium mb-2">Backstory</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {meta.backstory}
            </p>
          </div>
        </>
      )}

      {meta.appearance_prompt && (
        <>
          <Separator />
          <div>
            <h4 className="text-sm font-medium mb-2">
              Appearance Description
            </h4>
            <p className="text-sm text-muted-foreground">
              {meta.appearance_prompt}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
