# higamathcontest.github.io
HiGA Math Contest を円滑に運営するための特設サイトです。<br>
開発者によるメモ書きとかしている


## データの管理いろいろまとめた（案）

- /contest（問題一覧、正解した問題は強調）
- /contest/questions/algebra/1/, /contest/questions/algebra/2...　（それぞれのページに電卓と解答欄。Problem Table から持ってくる）
- /contest/submissions　（正誤結果の表示・解答後ここへ移動）
- /contest/answer　（解説一覧・コンテスト終了後公開）


1. 参加登録(/register)にて、
    - ユーザー名
    - 学年<br>
    を保存。user_id（PK、自動生成）を持つ Record を INSERT し、それぞれ<br>
    - username
    - grade<br>
    に保存。 
    - Teams で告知する HiGA Key を入力する Input 欄を配置。database/contest-settings を参照して判定。
    - 規約同意の旨の確認のための Checkbox を配置する。<br>
    を保存する

2. user_id は、ブラウザの localStorage にも保存。<br>user_id (localStorage) => user_id(database) => user_id(それぞれのtable) => 様々な情報。<br>usernameの役割は表示名のみ。

3. database は以下の内容を保存する。（重要）

    - ① Pprofiles：基本情報
        - user_id (uuid) Primary Key
        - username：ユーザー名 Unique 制約
        - grade：学年
        - score：合計スコア
        - penalty：ペナルティ数<br>
        内部識別はuser_id
        
    - ② Problems：問題（公開）
        - problem_id (uuid) Primary Key
        - score：点数
        - field：分野（A, N, C, G）
        - problem_number：分野別番号
        - content：問題（status == running で公開）*
        - correct：正解（絶対に隠す）
        - explanation：解説（status == finished で公開）<br>
        *TeX表記を含む。JSで取得→innerHTMLで挿入→MathJaxでレンダリングで実現可能。

    - ③ Submissions：回答提出
        - id (uuid) Primary Key
        - user_id (uuid) Foreign Key
        - problem_id：(uuid) Foreign Key
        - answer：回答
        - is_correct：正誤結果（jsだと書き換えが可能なため、supabase内のcheck_and_sumbit関数で判定）
        - submitted_at：回答時間

    - ④ contest-settingsコンテスト設定
        - status：before, running, finished
        - start_time：開始時間
        - end_time：終了時間
        - higa_key：HiGA生であることの証明Key
        - limit：回答数上限
        - penalty_minutes：ペナルティ時間（分）

    Row Level Security (RLS) を用いて、Problems/correct等を取得できないようにできるはず

4. Databaseで実装する関数
    - ① check_and_submit 関数
        以下の３つを連続して実行する。
        - 回答回数が上限に達していないかの判定
            - submissions内のuser_idが一致するrecordの個数<=回数上限がTrueなら次へ。Falseならエラー表示。
        - SubmissionsへのrecordのINSERT
        - 正誤判定
            - Problems/correct == answerがTrueならprofilesのscoreを更新, Falseならprofilesのpenaltyを更新。

5. 大会実施全体に関わることについて
    - コンテスト問題・回答ページの非表示
        - supabaseにて制御。(before, running, finished)で状態を管理し、必要に応じてリダイレクト。時間はsupabaseに保存。
        - 潜り込めそうだが、そこは参加規約に明記（あとは良心等を信じる）
    - 制限時間等の表示
        - 上記と同様に(before, running, finished)で状態を管理し、開催まで◯日、残り時間◯分、終了みたいに切り替える。
    - 順位表の表示
        - 状態で制御
            - before, running：「コンテスト終了後表示されます」*
        リアルタイムで順位表を更新する？ここ結構大事
    
6. 登録後の変更等への対応
    - localStorageの削除
        - 故意の操作、不可避的なインシデントによって、localStorageが消えた場合は、ユーザーがusernameとgradeの入力で再保存できる機能を備える
    - usernameの変更
        - 機能設置。
    - userの削除
        - 機能設置。

7. 情報の扱いについて
    - あらゆる情報は supabase で一元管理すべき？

8. Privacy Policy について
    - Supabaseでどのように情報が扱われるかと、個人を特定できる情報は一切扱わないことを明記したページがあるべき


## その他編集すべきことをまとめた（案）・やりたい機能とかもまとめていこう
ルール・概要・規約をどのページに置くか、少し散らばり気味では？
運営を脅かすようなサイバー的侵入・破壊の厳禁を記載。
複数アカウント所持の厳禁
ハンバーガーメニュー
