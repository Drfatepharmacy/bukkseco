
CREATE OR REPLACE FUNCTION public.get_or_create_direct_room(_other_user uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _room uuid;
  _tenant uuid;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _other_user IS NULL OR _other_user = _me THEN RAISE EXCEPTION 'Invalid recipient'; END IF;

  -- Find existing direct room with both members
  SELECT cr.id INTO _room
  FROM public.chat_rooms cr
  JOIN public.chat_participants p1 ON p1.room_id = cr.id AND p1.user_id = _me
  JOIN public.chat_participants p2 ON p2.room_id = cr.id AND p2.user_id = _other_user
  WHERE cr.type = 'direct'
  LIMIT 1;

  IF _room IS NOT NULL THEN
    RETURN _room;
  END IF;

  SELECT tenant_id INTO _tenant FROM public.profiles WHERE id = _me;

  INSERT INTO public.chat_rooms (type, tenant_id)
  VALUES ('direct', _tenant)
  RETURNING id INTO _room;

  INSERT INTO public.chat_participants (room_id, user_id)
  VALUES (_room, _me), (_room, _other_user);

  RETURN _room;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_direct_room(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_room(uuid) TO authenticated;
