import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { errorMessage } from "@/components/nd/page";
import { useOrg } from "@/lib/org-context";
import { getStickImageLinks } from "@/lib/stick-image.functions";
import { downloadStickImage } from "@/lib/stick-image";

const mb = (n: number) => `${Math.round(n / 1048576)} MB`;

/** Step 1 of Prepare USB stick: the NexWipe boot image (checked piece by piece), written with balenaEtcher. */
export function StickImageDownload() {
  const { orgId } = useOrg();
  const getLinks = useServerFn(getStickImageLinks);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function onDownload() {
    setSaved(null);
    setProgress({ done: 0, total: 1 });
    try {
      const links = await getLinks({ data: { orgId } });
      if (!links) {
        toast.error("No stick image has been released yet. Ask NexWipe support.");
        return;
      }
      setProgress({ done: 0, total: links.manifest.size });
      const blob = await downloadStickImage(links, (done, total) => setProgress({ done, total }));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = links.manifest.file;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
      setSaved(links.manifest.file);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="space-y-2 rounded-md border p-3 text-sm">
      <p className="font-medium">1. Boot image (once per stick)</p>
      <p className="text-muted-foreground">
        Download the NexWipe boot image and write it to a <b>spare</b> USB stick (2 GB or more) with{" "}
        <b>balenaEtcher</b>. This erases everything on that stick. Afterwards the stick shows in
        Windows as a drive named <b>NEXWIPE</b>; do step 2 on that drive.
      </p>
      {progress ? (
        <div className="space-y-1">
          <Progress value={(100 * progress.done) / progress.total} />
          <p className="text-xs text-muted-foreground">
            {progress.total > 1
              ? `${mb(progress.done)} of ${mb(progress.total)}, each piece checked`
              : "Preparing…"}
          </p>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={onDownload}>
          Download stick image
        </Button>
      )}
      {saved && (
        <p className="text-success">
          Saved {saved}. Open balenaEtcher → Flash from file → this file → choose the spare stick →
          Flash.
        </p>
      )}
    </div>
  );
}
