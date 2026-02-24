/contest, /register, /ranking は /contest内に統合

- /contest
	- top画面：コンテスト名、時間、問題数、/contest-accountへのリンク表示。SignInなら、”Enter”を表示しクリックで/contest/problemsへ遷移。!signInなら”Register”を表示しクリックで、/register画面へ遷移。時間表示*。
- /contest/register
	- register画面（すでにアカウントを持っている人の復活用フォームと、まだ作成していない新規作成用フォームの２つを用意）
- contest/problems
	- 問題一覧画面：問題一覧。ユーザーを取得して、正答済の問題は色で強調。時間表示*。
- /contest/problems/algebra/1/, /contest/questions/algebra/2...　（それぞれのページに電卓と解答欄。問題は直書き。Github覗かれたら終わるけど、それを禁止することを参加規約に明記。status == beforeならこれらのサイトにアクセスしたらredirectしみれないようにする）
- /contest/submissions　（正誤結果の表示・解答後ここへ移動）
- /contest/answer　（status == 公開, problemと同様にgithubに直書き。閲覧禁止。）
- /contest/ranking　（status == finishedの後、自動集計、反映。）
- /contest/account　usernameの変更とアカウントの削除用

*時間表示 （status == beforeなら開催までの時間、 == runningなら残り時間、 == finishedなら、”finished”を表示）
../problems, ../submissions, ../rankingはタブ切り替え


1. 参加登録(/register)にて、
    - ユーザー名
    - 学年
    - パスワード
    を保存。user_id（PK, authで生成）を持つ Record を INSERT し、それぞれ
    - username
    - grade
    に保存。 
    - Teams で告知する HiGA Key を入力する Input 欄を配置。database/contest-settings を参照して判定。
    - 規約同意の旨の確認のための Checkbox を配置する。
    を保存する

2. user_idはlocalStorageに保存しない（書き換えが生まれる可能性あり && 一般的な手法）。usernameは単なる表示名。authで判定。JWTを発行しログイン状態を保持。

3. database は以下の内容を保存する。（重要）

    - ① profiles
        - user_id uuid (auth.uid()) Primary Key
        - username text unique not null
        - grade text
        - score int default 0

	RLS：
	select: only user own.
	update: only user own.
	insert: only when logIn.
        
    - ② problems
        - id uuid Primary Key (random)
	   - problem_number int not null
	   - field text not null
        - correct_answer text not null
        - point int not null
	
    - ③ submissions：回答提出
        - id uuid Primary Key (random)
        - user_id uuid foreign Key
        - problem_id uuid foreign Key(problems.id)
        - answer text not null
        - is_correct boolean not null
        - submitted_at timestamp

    - ④ contest_settings：コンテスト情報
	   - id int primary key default 1
        - status text before/running/finished not null
        - start_time timestamp not null
        - end_time timestamp not null
        - higa_key text not null
        - submissionlimit int not null
        - penalty_minutes int not null

- RLS (Row Level Security)について
	- 全てのテーブルでON
		- alter table xx enable row level security

	- ① profiles
		- select, update, insert by only own

	- ② submissions
		- see only own submissions
		- restrict insert, update, delete submissions
		- revoked

	- ③ problems
		- everyone see detail
		- correct_answer must not be accessed
		- revoked

	- ④ contest_settings
		- everyone see detail


4. Databaseで実装する関数
check_and_submit 関数の処理内容

1. 入力を受け取る
   - 問題ID
   - 回答

2. 問題データを取得する
   - 正解
   - 配点

3. 問題が存在するか確認
   - 存在しなければ error を返す

4. そのユーザーが既に正解しているか確認
   - 正解済みなら already_solved を返す

5. 回答を正解と比較する

6. もし正解だった場合

   6-1. 正解として submissions に記録する
   6-2. 正解より前の不正解回数を数える
   6-3. profiles の score に配点を加算する
   6-4. 以下の情報を返す
        - status: correct
        - 加算点
        - 正解前の不正解回数

7. もし不正解だった場合

   7-1. 不正解として submissions に記録する
   7-2. status: wrong を返す

・Ranking生成方法について
学年別と、全体の２つを作る

順位表生成ロジック

1. contest_settings を取得
   - start_time
   - end_time
   - penalty_minutes

2. コンテスト時間内の submissions のみ抽出

3. 各ユーザー × 各問題ごとに：

   3-1. 最初の正解提出を取得
   3-2. 正解前の不正解回数を取得
   3-3. もし正解していなければ「未解答」

4. 各問題ごとのペナルティ時間を計算

   問題ペナルティ =
     (正解時刻 − start_time)
     + (不正解回数 × penalty_minutes)

5. ユーザーごとに集計

   - total_score = 解いた問題の合計点
   - last_solved_time = 最後に正解した時刻

6. 並び替え

   ORDER BY
     total_score DESC,
     last_solved_time ASC

7. 順位番号を振る

8. フロント表示用の形式に整形


5. 大会実施全体に関わることについて
    - コンテスト問題・回答ページの非表示
        - supabaseにて制御。(before, running, finished)で状態を管理し、必要に応じてリダイレクト。時間はsupabaseに保存。
        - 潜り込めそうだが、そこは参加規約に明記（あとは良心等を信じる）
    - 制限時間等の表示
        - 上記と同様に(before, running, finished)で状態を管理し、開催まで◯日、残り時間◯分、終了みたいに切り替える。
    - 順位表の表示
        - before/runningはまだ始まっていない、開催中。終了後公開等のメッセージ。finishedご、学年別と、全体順位表を表示。


8. Privacy Policy について
    - Supabaseでどのように情報が扱われるかと、個人を特定できる情報は一切扱わないことを明記したページを作成

