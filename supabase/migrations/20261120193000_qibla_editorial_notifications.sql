-- Qibla editorial notifications are emitted atomically from database state changes.
-- This covers Editorial Studio, Command Center, AI submissions, and future clients.
create or replace function public.qibla_notify_editorial_event()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_recipient uuid; v_title text; v_body text; v_type text; v_entity text; v_actor uuid;
begin
 if tg_table_name='qibla_staff_applications' then
   if tg_op<>'UPDATE' or old.status=new.status or new.status not in ('approved','denied') then return new; end if;
   v_recipient:=new.applicant_id;v_entity:='qibla_application';v_actor:=new.reviewer_id;
   if new.status='approved' then
     v_type:='qibla_team_welcome';v_title:='🎉 Welcome to the Qibla editorial team!';
     v_body:='Congratulations! Your application to join as '||initcap(new.requested_role)||' has been approved. Your editorial journey begins now.';
   else
     v_type:='qibla_team_application_denied';v_title:='Your Qibla editorial application';
     v_body:='Your application was not approved at this time.'||case when length(trim(coalesce(new.reviewer_note,'')))>0 then ' Reviewer feedback: '||left(new.reviewer_note,350) else '' end;
   end if;
 elsif tg_table_name='qibla_submissions' then
   if new.status='submitted' and (tg_op='INSERT' or old.status is distinct from new.status) then
     -- Notify active approvers and admins; don't notify the author about their own submission.
     for v_recipient in
       select user_id from public.qibla_staff where role in ('approver','admin') and user_id<>new.author_id
       union
       select id from auth.users where lower(email)='hudhudbyelmi@gmail.com' and id<>new.author_id
     loop
       if not exists(select 1 from public.notification_preferences where user_id=v_recipient and in_app_enabled=false) then
         insert into public.notifications(recipient_id,actor_id,type,title,body,entity_type,entity_id)
         values(v_recipient,new.author_id,'qibla_submission_review','📝 New Qibla article awaiting review',
           'A '||case when new.kind='newsletter' then 'Newsletter' else 'Magazine' end||' submission is ready: '||left(new.title,180),
           'qibla_submission',new.id);
       end if;
     end loop;
     return new;
   end if;
   if tg_op='UPDATE' and new.status is distinct from old.status and new.status in ('approved','rejected','changes_requested') then
     v_recipient:=new.author_id;v_actor:=new.reviewer_id;v_entity:='qibla_submission';
     if new.status='approved' then
       v_type:='qibla_article_approved';v_title:='🎉 Your Qibla article was approved!';
       v_body:='Congratulations! "'||left(new.title,140)||'" has been approved by the editorial team.';
     elsif new.status='rejected' then
       v_type:='qibla_article_rejected';v_title:='Qibla editorial decision';
       v_body:='"'||left(new.title,140)||'" was not approved.';
     else
       v_type:='qibla_article_changes';v_title:='✍️ Changes requested for your article';
       v_body:='The editorial team requested revisions to "'||left(new.title,140)||'".';
     end if;
     if length(trim(coalesce(new.review_note,'')))>0 then v_body:=v_body||' Feedback: '||left(new.review_note,350);end if;
   else return new;end if;
 else return new;end if;
 if v_recipient is not null and not exists(select 1 from public.notification_preferences where user_id=v_recipient and in_app_enabled=false) then
   insert into public.notifications(recipient_id,actor_id,type,title,body,entity_type,entity_id)
   values(v_recipient,v_actor,v_type,v_title,v_body,v_entity,new.id);
 end if;
 return new;
end $$;
drop trigger if exists qibla_staff_application_notification on public.qibla_staff_applications;
create trigger qibla_staff_application_notification after update on public.qibla_staff_applications
for each row execute function public.qibla_notify_editorial_event();
drop trigger if exists qibla_submission_notification on public.qibla_submissions;
create trigger qibla_submission_notification after insert or update on public.qibla_submissions
for each row execute function public.qibla_notify_editorial_event();
