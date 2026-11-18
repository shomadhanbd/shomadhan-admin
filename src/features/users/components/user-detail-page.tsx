"use client";

import { use, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, ClipboardList, Flame, ListChecks, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import { date, dateTime } from "@/lib/format";
import { useAcademicGroups, useBatches, useEducationLevels } from "@/lib/lookups";
import { StatTile } from "@/features/dashboard/components/stat-tile";
import { GrantDialog } from "@/features/subscriptions/components/subscription-dialogs";
import { subscriptionSource } from "@/features/subscriptions/constants";
import { USERS, userKeys, usersApi } from "@/features/users/api";
import { useRecordSave } from "@/hooks/use-record-save";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EditCard, Empty, ViewRow } from "@/components/shared/edit-card";
import { LookupSelect } from "@/components/shared/lookup-select";
import { EmptyState, Field, PageHeader } from "@/components/shared/page-shell";
import { displayName } from "./users-page";
import type { UserDetail } from "@/features/users/types";

const CARD = "rounded-(--shape-md) bg-card shadow-sm ring-1 ring-foreground/[0.07]";

const ATTEMPT_KINDS = { mock: "Mock test", practice: "Practice test", daily: "Daily challenge" } as const;
const ATTEMPT_STATUSES = {
  in_progress: "In progress",
  submitted: "Awaiting marking",
  expired: "Expired",
  graded: "Graded",
} as const;

function Card({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className={CARD}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {aside}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

/** Name and email: the card's own form, saved with a PATCH of just these fields. */
function ProfileCard({ user, save }: { user: UserDetail; save: ReturnType<typeof useRecordSave<UserDetail>> }) {
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [email, setEmail] = useState(user.email ?? "");

  return (
    <EditCard
      title="Profile"
      view={
        <dl className="divide-y divide-border">
          <ViewRow label="Name">{user.full_name || <Empty />}</ViewRow>
          <ViewRow label="Mobile">{user.mobile ?? <Empty />}</ViewRow>
          <ViewRow label="Email">{user.email || <Empty />}</ViewRow>
        </dl>
      }
      onEdit={() => {
        save.reset();
        setFirstName(user.first_name);
        setLastName(user.last_name);
        setEmail(user.email ?? "");
      }}
      onSave={() =>
        save.save({ first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim() || null }, [
          "first_name",
          "last_name",
          "email",
        ])
      }
      pending={save.pending}
      error={save.error}
      form={
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="user-first-name" label="First name" error={save.errors.first_name}>
              <Input id="user-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
            <Field id="user-last-name" label="Last name" error={save.errors.last_name}>
              <Input id="user-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
          </div>
          <Field id="user-email" label="Email" error={save.errors.email}>
            <Input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <p className="text-xs text-muted-foreground">
            The mobile number is how the student signs in, so it cannot be changed here.
          </p>
        </>
      }
    />
  );
}

/** Level, group and batch: what the app shows the student is filtered by these. */
function PlacementCard({ user, save }: { user: UserDetail; save: ReturnType<typeof useRecordSave<UserDetail>> }) {
  const levels = useEducationLevels();
  const groups = useAcademicGroups();
  const batches = useBatches();
  const [level, setLevel] = useState(String(user.education_level ?? ""));
  const [group, setGroup] = useState(String(user.academic_group ?? ""));
  const [batch, setBatch] = useState(String(user.batch ?? ""));

  const groupOptions = useMemo(
    () => groups.data?.filter((g) => String(g.education_level) === level),
    [groups.data, level],
  );
  const batchOptions = useMemo(
    () => batches.data?.filter((b) => String(b.education_level) === level),
    [batches.data, level],
  );

  return (
    <EditCard
      title="Placement"
      description="The app shows the student only the content of their level and group."
      view={
        <dl className="divide-y divide-border">
          <ViewRow label="Education level">{user.education_level_name ?? <Empty />}</ViewRow>
          <ViewRow label="Academic group">{user.academic_group_name ?? <Empty />}</ViewRow>
          <ViewRow label="Batch">{user.batch_name ?? <Empty />}</ViewRow>
        </dl>
      }
      onEdit={() => {
        save.reset();
        setLevel(String(user.education_level ?? ""));
        setGroup(String(user.academic_group ?? ""));
        setBatch(String(user.batch ?? ""));
      }}
      onSave={() =>
        save.save(
          {
            education_level: level ? Number(level) : null,
            academic_group: group ? Number(group) : null,
            batch: batch ? Number(batch) : null,
          },
          ["education_level", "academic_group", "batch"],
        )
      }
      pending={save.pending}
      error={save.error}
      form={
        <>
          <Field id="user-level" label="Education level" error={save.errors.education_level}>
            <LookupSelect
              id="user-level"
              value={level}
              onChange={(v) => {
                setLevel(v);
                // The group and batch belong to the previous level.
                setGroup("");
                setBatch("");
              }}
              options={levels.data}
              placeholder="Pick a level"
              className="w-full"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="user-group" label="Academic group" error={save.errors.academic_group}>
              <LookupSelect
                id="user-group"
                value={group}
                onChange={setGroup}
                options={groupOptions}
                placeholder={level ? "Pick a group" : "Pick a level first"}
                disabled={!level}
                className="w-full"
              />
            </Field>
            <Field id="user-batch" label="Batch" error={save.errors.batch}>
              <LookupSelect
                id="user-batch"
                value={batch}
                onChange={setBatch}
                options={batchOptions}
                placeholder={level ? "No batch" : "Pick a level first"}
                allLabel="No batch"
                disabled={!level}
                className="w-full"
              />
            </Field>
          </div>
        </>
      }
    />
  );
}

/** `/users/{id}`: one account's progress, tests and subscriptions, with its profile and placement editable in place. */
export function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [confirmingStatus, setConfirmingStatus] = useState(false);
  const [granting, setGranting] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: userKeys.detail(Number(id)),
    queryFn: () => usersApi.get(Number(id)),
  });

  const save = useRecordSave<UserDetail>({
    path: `${USERS}${id}/`,
    queryKey: [...userKeys.detail(Number(id))],
    listKey: [...userKeys.all],
  });

  const toggleActive = useMutation({
    mutationFn: () => usersApi.update(Number(id), { is_active: !user!.is_active }),
    onSuccess: (saved) => {
      queryClient.setQueryData(userKeys.detail(saved.id), saved);
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success(saved.is_active ? "Account reactivated" : "Account deactivated");
    },
    onSettled: () => setConfirmingStatus(false),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[132px] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader title="User" backHref="/users" />
        <div className={CARD}>
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="This user could not be found"
            description="The id may be wrong."
          />
        </div>
      </div>
    );
  }

  const { progress, streak } = user;

  return (
    <div className="space-y-6">
      <PageHeader
        title={displayName(user)}
        description={user.full_name ? (user.mobile ?? "") : "No name set"}
        backHref="/users"
      >
        {user.has_active_subscription ? <Badge>VIP</Badge> : <Badge variant="outline">Free</Badge>}
        {!user.is_active && <Badge variant="outline">Deactivated</Badge>}
        {user.is_staff && <Badge variant="secondary">Staff</Badge>}
        <Button size="lg" variant="outline" onClick={() => setConfirmingStatus(true)}>
          {user.is_active ? <UserX className="h-4 w-4" /> : <CircleCheck className="h-4 w-4" />}
          {user.is_active ? "Deactivate" : "Reactivate"}
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Questions answered"
          value={progress.questions_answered}
          context={progress.last_active ? `Last active ${date(progress.last_active)}` : "Has not practised yet"}
          icon={<ListChecks className="h-4 w-4" />}
          accent={1}
        />
        <StatTile
          label="Accuracy (%)"
          value={progress.accuracy ?? 0}
          context={
            progress.accuracy === null
              ? "No auto-marked answers yet"
              : `${progress.correct} right, ${progress.wrong} wrong`
          }
          icon={<CircleCheck className="h-4 w-4" />}
          accent={2}
        />
        <StatTile
          label="Tests taken"
          value={progress.tests_taken}
          context="Mock tests, practice tests and daily challenges"
          icon={<ClipboardList className="h-4 w-4" />}
          accent={3}
        />
        <StatTile
          label="Current streak"
          value={streak.current}
          context={`Days in a row · longest ${streak.longest}`}
          icon={<Flame className="h-4 w-4" />}
          accent={4}
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <ProfileCard key={`profile-${user.id}`} user={user} save={save} />
          <PlacementCard key={`placement-${user.id}`} user={user} save={save} />
          <Card title="Account">
            <dl className="divide-y divide-border">
              <ViewRow label="Status">{user.is_active ? "Active" : "Deactivated: cannot sign in"}</ViewRow>
              <ViewRow label="Onboarded">{user.is_onboarded ? "Yes" : "No: has not picked a level and group"}</ViewRow>
              <ViewRow label="Joined">{dateTime(user.date_joined)}</ViewRow>
              <ViewRow label="Last sign-in">{dateTime(user.last_login)}</ViewRow>
              <ViewRow label="CQ answers submitted">{progress.cq_submissions}</ViewRow>
              <ViewRow label="Reports filed">{progress.reports_filed}</ViewRow>
            </dl>
          </Card>
        </div>

        <div className="space-y-4">
          <Card
            title="Subscriptions"
            aside={
              <Button variant="outline" size="sm" onClick={() => setGranting(true)}>
                Grant VIP
              </Button>
            }
          >
            {user.subscriptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subscriptions. The student is on the free plan.</p>
            ) : (
              <ul className="divide-y divide-border">
                {user.subscriptions.map((s) => (
                  <li key={s.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{s.product_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {date(s.starts_at)} – {date(s.expires_at)} · {subscriptionSource(s.source)}
                      </p>
                    </div>
                    {s.is_active && new Date(s.expires_at) > new Date() ? (
                      <Badge>Active</Badge>
                    ) : (
                      <Badge variant="outline">Ended</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Recent tests">
            {user.recent_attempts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tests taken yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {user.recent_attempts.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {ATTEMPT_KINDS[a.kind]} · {dateTime(a.started_at)} · {ATTEMPT_STATUSES[a.status]}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium text-foreground tabular-nums">{Number(a.total_score)}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.correct_count} right · {a.wrong_count} wrong
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingStatus}
        onOpenChange={setConfirmingStatus}
        tone={user.is_active ? "destructive" : "default"}
        title={user.is_active ? "Deactivate this account?" : "Reactivate this account?"}
        description={
          <>
            <span className="font-medium text-foreground">{displayName(user)}</span>{" "}
            {user.is_active
              ? "will be signed out and unable to sign in again until reactivated. Their history is kept."
              : "will be able to sign in again."}
          </>
        }
        confirmLabel={user.is_active ? "Deactivate" : "Reactivate"}
        pending={toggleActive.isPending}
        onConfirm={() => toggleActive.mutate()}
      />

      {granting && (
        <GrantDialog
          student={{ id: user.id, name: user.full_name, mobile: user.mobile }}
          onOpenChange={(o) => !o && setGranting(false)}
        />
      )}
    </div>
  );
}
