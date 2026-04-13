const { createAvatar, createPoster } = require('./placeholders');
const { createEmptyState } = require('./schema');

function createSeedState() {
  const state = createEmptyState();
  const counters = state.nextIds;
  const now = Date.now();

  function iso(hoursAgo) {
    return new Date(now - hoursAgo * 60 * 60 * 1000).toISOString();
  }

  function nextId(key) {
    const id = counters[key];
    counters[key] += 1;
    return id;
  }

  function addUser(spec) {
    const user = {
      id: nextId('users'),
      email: spec.email,
      username: spec.username,
      password: spec.password,
      nickname: spec.nickname,
      department: spec.department,
      student_year: spec.studentYear,
      bio: spec.bio,
      manner_score: spec.mannerScore,
      profile_image_url: createAvatar({
        name: spec.nickname,
        accent: spec.accent,
        background: spec.background,
      }),
      created_at: iso(spec.createdHoursAgo ?? 240),
    };

    state.users.push(user);
    return user;
  }

  function addPost(spec) {
    const createdAt = iso(spec.createdHoursAgo);
    const post = {
      id: nextId('posts'),
      post_name: `post-${spec.slug}`,
      author_id: spec.author.id,
      title: spec.title,
      content: spec.content,
      category: spec.category,
      subcategory: spec.subcategory,
      price: spec.price ?? null,
      status: spec.status,
      trade_type: spec.tradeType ?? null,
      location: spec.location ?? null,
      is_price_offer_allowed: Boolean(spec.isPriceOfferAllowed),
      recruitment_target: spec.recruitmentTarget ?? null,
      recruitment_current: spec.recruitmentCurrent ?? null,
      tags: spec.tags ?? [],
      created_at: createdAt,
      updated_at: createdAt,
    };

    state.posts.push(post);

    spec.images.forEach((image, index) => {
      state.post_images.push({
        id: nextId('postImages'),
        post_id: post.id,
        image_url: createPoster({
          title: image.title,
          subtitle: image.subtitle,
          accent: image.accent,
          background: image.background,
        }),
        sort_order: index,
      });
    });

    return post;
  }

  function addLike(post, user, hoursAgo) {
    state.post_likes.push({
      id: nextId('postLikes'),
      post_id: post.id,
      user_id: user.id,
      created_at: iso(hoursAgo),
    });
  }

  function addComment(post, user, content, hoursAgo) {
    state.comments.push({
      id: nextId('comments'),
      post_id: post.id,
      user_id: user.id,
      content,
      created_at: iso(hoursAgo),
    });
  }

  function addRoom({ post, seller, buyer, createdHoursAgo, messages }) {
    const room = {
      id: nextId('chatRooms'),
      post_id: post.id,
      seller_id: seller.id,
      buyer_id: buyer.id,
      created_at: iso(createdHoursAgo),
    };

    state.chat_rooms.push(room);

    messages.forEach((message, index) => {
      state.messages.push({
        id: nextId('messages'),
        room_id: room.id,
        sender_id: message.sender.id,
        content: message.content ?? '',
        image_url: message.imageUrl ?? null,
        read_by: message.readBy ?? [message.sender.id],
        created_at: iso(createdHoursAgo - (messages.length - index - 1) * 0.5),
      });
    });
  }

  const users = {
    master: addUser({
      email: 'master@korea.ac.kr',
      username: 'horangmaster',
      password: 'Horang2026!',
      nickname: '호랭운영진',
      department: '컴퓨터학과',
      studentYear: 4,
      bio: '호랭마켓 MVP를 관리하는 마스터 계정입니다.',
      mannerScore: 41.2,
      accent: '#7A2338',
      background: '#F6E3E7',
      createdHoursAgo: 600,
    }),
    minji: addUser({
      email: 'minji@korea.ac.kr',
      username: 'anammj',
      password: 'test1234',
      nickname: '안암민지',
      department: '정보보호학부',
      studentYear: 3,
      bio: '보안이랑 커피 좋아해요.',
      mannerScore: 38.7,
      accent: '#6A2332',
      background: '#F9E8EB',
      createdHoursAgo: 500,
    }),
    suho: addUser({
      email: 'suho@korea.ac.kr',
      username: 'suhokku',
      password: 'test1234',
      nickname: '공대수호',
      department: '기계공학부',
      studentYear: 2,
      bio: '실험 끝나면 거래 답장 빨라요.',
      mannerScore: 36.4,
      accent: '#8A3246',
      background: '#F8ECEE',
      createdHoursAgo: 480,
    }),
    yuna: addUser({
      email: 'yuna@korea.ac.kr',
      username: 'yuna313',
      password: 'test1234',
      nickname: '유나스터디',
      department: '경영학과',
      studentYear: 4,
      bio: '스터디와 공모전 모집 중입니다.',
      mannerScore: 39.9,
      accent: '#913B4C',
      background: '#F8EAEC',
      createdHoursAgo: 460,
    }),
    dohyun: addUser({
      email: 'dohyun@korea.ac.kr',
      username: 'dohyunkr',
      password: 'test1234',
      nickname: '도현풋살',
      department: '체육교육과',
      studentYear: 3,
      bio: '운동 모임 열심히 합니다.',
      mannerScore: 37.3,
      accent: '#7F2035',
      background: '#F5E6E8',
      createdHoursAgo: 430,
    }),
    ara: addUser({
      email: 'ara@korea.ac.kr',
      username: 'araarts',
      password: 'test1234',
      nickname: '아라홍보팀',
      department: '디자인조형학부',
      studentYear: 2,
      bio: '동아리와 행사 홍보 담당입니다.',
      mannerScore: 40.1,
      accent: '#6B1D2B',
      background: '#FAECEE',
      createdHoursAgo: 410,
    }),
  };

  const posts = [
    addPost({
      slug: 'os-book',
      author: users.minji,
      title: '운영체제 교재 거의 새 책 판매해요',
      content: '필기 거의 없고, 비닐커버 씌워서 깨끗합니다. 안암역 근처에서 직거래 가능해요.',
      category: 'market',
      subcategory: '교재',
      price: 18000,
      status: '판매중',
      tradeType: 'direct',
      location: '안암역 2번 출구',
      isPriceOfferAllowed: true,
      tags: ['운영체제', '전공책'],
      createdHoursAgo: 5,
      images: [
        { title: '운영체제', subtitle: '교재 판매', accent: '#7A2338', background: '#F8F3EE' },
        { title: '필기 거의 없음', subtitle: '상태 A급', accent: '#A13D52', background: '#F9ECEF' },
      ],
    }),
    addPost({
      slug: 'ipad-pencil',
      author: users.suho,
      title: '애플펜슬 2세대 급처합니다',
      content: '졸업 준비로 정리 중입니다. 박스 포함이고 배터리 상태 좋습니다.',
      category: 'market',
      subcategory: '전자제품',
      price: 98000,
      status: '예약중',
      tradeType: 'either',
      location: '하나스퀘어',
      isPriceOfferAllowed: false,
      tags: ['애플펜슬', '아이패드'],
      createdHoursAgo: 8,
      images: [{ title: 'Apple Pencil', subtitle: '2세대', accent: '#731D32', background: '#F5EFF0' }],
    }),
    addPost({
      slug: 'electric-pot',
      author: users.master,
      title: '기숙사 전기포트 나눔 겸 판매',
      content: '생활기숙사 퇴실 준비로 내놓아요. 바로 사용 가능하고 상태 좋습니다.',
      category: 'market',
      subcategory: '가구/의류',
      price: 12000,
      status: '판매중',
      tradeType: 'direct',
      location: 'CJ International House',
      isPriceOfferAllowed: true,
      tags: ['기숙사', '생활용품'],
      createdHoursAgo: 18,
      images: [{ title: '전기포트', subtitle: '기숙사 생활용품', accent: '#7A2338', background: '#F9F1F2' }],
    }),
    addPost({
      slug: 'network-study',
      author: users.yuna,
      title: '네트워크 스터디 2명 추가 모집합니다',
      content: '매주 수요일 저녁 도서관 세미나실에서 진행합니다. 면접 준비 겸 네트워크 기초부터 함께 봐요.',
      category: 'recruit',
      subcategory: '스터디',
      status: '모집중',
      recruitmentTarget: 4,
      recruitmentCurrent: 2,
      location: '중앙도서관',
      tags: ['네트워크', 'CS'],
      createdHoursAgo: 3,
      images: [{ title: 'Network Study', subtitle: '2명 추가 모집', accent: '#8E3548', background: '#F8ECEF' }],
    }),
    addPost({
      slug: 'hackathon-team',
      author: users.master,
      title: 'AI 해커톤 프론트엔드 팀원 모집',
      content: '디자인 시안은 있고 React Native 가능한 분을 찾습니다. 주말 중심으로 빠르게 달릴 예정입니다.',
      category: 'recruit',
      subcategory: '대회/공모전',
      status: '모집중',
      recruitmentTarget: 5,
      recruitmentCurrent: 3,
      location: '하나과학관',
      tags: ['해커톤', 'React Native'],
      createdHoursAgo: 20,
      images: [{ title: 'AI Hackathon', subtitle: 'Frontend Needed', accent: '#7D2537', background: '#F8F0F1' }],
    }),
    addPost({
      slug: 'futsal-members',
      author: users.dohyun,
      title: '토요일 아침 풋살 정기모임 인원 받아요',
      content: '실력 상관 없이 재미있게 차실 분 구합니다. 보문 인조잔디장에서 모여요.',
      category: 'recruit',
      subcategory: '취미/오락',
      status: '모집중',
      recruitmentTarget: 10,
      recruitmentCurrent: 7,
      location: '보문 인조잔디장',
      tags: ['풋살', '운동'],
      createdHoursAgo: 26,
      images: [{ title: 'Weekend Futsal', subtitle: '정기모임', accent: '#7B2232', background: '#F5F0F1' }],
    }),
    addPost({
      slug: 'band-club',
      author: users.ara,
      title: '밴드 동아리 신입부원 모집합니다',
      content: '보컬, 기타, 드럼 모두 환영해요. 초보자도 합주 체험 가능합니다.',
      category: 'promo',
      subcategory: '동아리',
      status: '진행중',
      location: '학생회관 3층',
      tags: ['동아리', '밴드'],
      createdHoursAgo: 12,
      images: [{ title: 'Band Club', subtitle: '신입부원 모집', accent: '#732033', background: '#F7ECEE' }],
    }),
    addPost({
      slug: 'design-fair',
      author: users.ara,
      title: '디자인 학회 전시회 보러 오세요',
      content: '이번 주 금요일과 토요일에 전시가 열립니다. 고려대 학생 누구나 방문 가능해요.',
      category: 'promo',
      subcategory: '행사',
      status: '진행중',
      location: '미디어관 로비',
      tags: ['전시', '디자인'],
      createdHoursAgo: 30,
      images: [{ title: 'Design Fair', subtitle: '이번 주 전시', accent: '#8B3750', background: '#FBF0F2' }],
    }),
    addPost({
      slug: 'cafeteria-tip',
      author: users.minji,
      title: '하나스퀘어 점심시간 피크 피하는 팁 공유',
      content: '12시 10분 전에 가면 비교적 여유 있고, 1시 이후에는 줄이 많이 줄어듭니다.',
      category: 'community',
      subcategory: '정보',
      status: '일반',
      location: '하나스퀘어',
      tags: ['학교생활', '학식'],
      createdHoursAgo: 16,
      images: [{ title: 'Campus Tip', subtitle: '학식 시간대', accent: '#7A2338', background: '#F8F2F0' }],
    }),
    addPost({
      slug: 'crypto-book',
      author: users.master,
      title: '암호학 개론 교재 저렴하게 팝니다',
      content: '수업 끝나서 내놓아요. 형광펜 살짝 있지만 문제 풀이에는 지장 없습니다.',
      category: 'market',
      subcategory: '교재',
      price: 15000,
      status: '판매중',
      tradeType: 'direct',
      location: '애기능 생활관 앞',
      isPriceOfferAllowed: true,
      tags: ['암호학', '전공책'],
      createdHoursAgo: 40,
      images: [{ title: '암호학 개론', subtitle: '중고 교재', accent: '#852C45', background: '#F8ECEF' }],
    }),
    addPost({
      slug: 'python-tutor',
      author: users.yuna,
      title: '파이썬 과외 및 코딩테스트 스터디 모집',
      content: '비전공자도 괜찮아요. 기본 문법부터 문제풀이까지 같이 갑니다.',
      category: 'recruit',
      subcategory: '과외',
      status: '모집중',
      recruitmentTarget: 3,
      recruitmentCurrent: 1,
      location: '백주년기념관',
      tags: ['파이썬', '과외'],
      createdHoursAgo: 52,
      images: [{ title: 'Python Tutoring', subtitle: '스터디 모집', accent: '#7C273B', background: '#F5ECEE' }],
    }),
    addPost({
      slug: 'reading-room',
      author: users.suho,
      title: '중도 열람실 자리 선점 문화 어떻게 생각해요?',
      content: '아침에 가방만 두고 오래 비우는 경우가 자주 보여서 궁금합니다.',
      category: 'community',
      subcategory: '질문',
      status: '일반',
      location: '중앙도서관',
      tags: ['열람실', '질문'],
      createdHoursAgo: 60,
      images: [{ title: '도서관 질문', subtitle: '열람실 문화', accent: '#6F2335', background: '#FAEFF1' }],
    }),
    addPost({
      slug: 'startup-club',
      author: users.ara,
      title: '창업 동아리 데모데이 관객 모집',
      content: '아이디어 피칭과 네트워킹 세션이 준비되어 있습니다. 간단한 다과 제공돼요.',
      category: 'promo',
      subcategory: '모집',
      status: '마감',
      location: 'LG-POSCO 경영관',
      tags: ['창업', '데모데이'],
      createdHoursAgo: 72,
      images: [{ title: 'Demo Day', subtitle: '관객 모집', accent: '#943C52', background: '#FAEEF1' }],
    }),
  ];

  addLike(posts[0], users.master, 4);
  addLike(posts[0], users.yuna, 3);
  addLike(posts[3], users.master, 2);
  addLike(posts[4], users.minji, 18);
  addLike(posts[6], users.master, 10);
  addLike(posts[9], users.minji, 39);

  addComment(posts[0], users.master, '안녕하세요! 오늘 저녁에도 거래 가능할까요?', 2);
  addComment(posts[3], users.minji, '관심 있습니다. 시간만 맞으면 참여할게요!', 1.5);
  addComment(posts[8], users.dohyun, '이 팁 좋네요. 저도 1시 이후 추천합니다.', 12);
  addComment(posts[11], users.master, '저도 비슷하게 느꼈어요. 규칙이 좀 명확하면 좋겠습니다.', 55);

  addRoom({
    post: posts[0],
    seller: users.minji,
    buyer: users.master,
    createdHoursAgo: 2.5,
    messages: [
      { sender: users.master, content: '안녕하세요! 아직 판매 중인가요?', readBy: [users.master, users.minji] },
      { sender: users.minji, content: '네, 아직 있어요. 오늘 저녁 거래 가능해요.', readBy: [users.minji, users.master] },
      { sender: users.master, content: '좋아요. 7시쯤 안암역에서 괜찮으실까요?', readBy: [users.master] },
    ],
  });

  addRoom({
    post: posts[4],
    seller: users.master,
    buyer: users.yuna,
    createdHoursAgo: 8,
    messages: [
      { sender: users.yuna, content: '안녕하세요! 프론트엔드 포지션 아직 열려 있나요?', readBy: [users.yuna, users.master] },
      { sender: users.master, content: '네, 아직 가능합니다. React Native 경험 있으실까요?', readBy: [users.master] },
    ],
  });

  return state;
}

module.exports = {
  createSeedState,
};
