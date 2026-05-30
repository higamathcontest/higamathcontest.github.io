// redirect.js
// status === 'before' のとき、is_admin でない限り /contest へリダイレクト。
// type="module" で読み込むこと。

import { supabase } from '/js/supabase-client.js'

document.body.style.visibility = 'hidden'

;(async () => {
  try {
    const { data: settings } = await supabase
      .from('contest_settings')
      .select('status')
      .eq('id', 1)
      .single()

    const status = settings?.status

    if (status !== 'before') {
      document.body.style.visibility = ''
      return
    }

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      location.replace('/contest')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', session.user.id)
      .single()

    if (!profile?.is_admin) {
      location.replace('/contest')
      return
    }

    document.body.style.visibility = ''

  } catch (e) {
    console.error('[redirect.js]', e)
    document.body.style.visibility = ''
  }
})()