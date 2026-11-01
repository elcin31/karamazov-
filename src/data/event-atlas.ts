export type EventDetail = {
  characterIds: string[];
  imageId: string;
  consequences: string;
  relatedIds: string[];
};
export const eventDetails: Record<string, EventDetail> = {
  family: {
    characterIds: ["fyodor", "dmitri", "ivan", "alexei"],
    imageId: "first-edition",
    consequences:
      "Раздельное воспитание братьев делает их возвращение встречей почти чужих людей. Денежный спор наследует более раннюю историю отсутствующей заботы.",
    relatedIds: ["monastery", "confession"],
  },
  monastery: {
    characterIds: ["fyodor", "dmitri", "ivan", "alexei", "zosima", "miusov"],
    imageId: "zosima-cell",
    consequences:
      "Несостоявшийся семейный разговор выносит противоречия на публику. Поклон Зосимы Дмитрию позднее получает новое значение в памяти героев.",
    relatedIds: ["confession", "zosima"],
  },
  confession: {
    characterIds: ["dmitri", "alexei", "katerina", "grushenka"],
    imageId: "portraits",
    consequences:
      "Алёша становится посредником в истории, где признание в бесчестии соседствует с упорным чувством собственной чести. Источник трёх тысяч рублей превращается в узел будущего обвинения.",
    relatedIds: ["women", "trial"],
  },
  women: {
    characterIds: ["grushenka", "katerina", "alexei"],
    imageId: "grushenka-lamp",
    consequences:
      "Попытка великодушия оборачивается соревнованием достоинства и унижением. Последующие встречи женщин невозможно понять без памяти об этой сцене.",
    relatedIds: ["onion", "epilogue"],
  },
  boys: {
    characterIds: ["ilyusha", "snegiryov", "dmitri", "alexei"],
    imageId: "snegirev-scene",
    consequences:
      "Семейное насилие Карамазовых отзывается в другой семье. Отвергнутая помощь заставляет Алёшу различить практическую нужду и потребность сохранить достоинство.",
    relatedIds: ["ilyusha-bed", "stone"],
  },
  rebellion: {
    characterIds: ["ivan", "alexei"],
    imageId: "brothers-tavern",
    consequences:
      "Разговор о страдании сменяется поэмой о свободе. Братья расходятся без окончательного согласия; сочувствие и логический ответ остаются разными способами отношения к другому.",
    relatedIds: ["departure", "nightmare"],
  },
  departure: {
    characterIds: ["ivan", "smerdyakov", "fyodor"],
    imageId: "smerdyakov-kitchen",
    consequences:
      "Прощальные разговоры допускают несовпадающие понимания намёка и разрешения. После преступления Иван вернётся к собственному желанию уехать как к нравственному вопросу.",
    relatedIds: ["smerdyakov-truth", "nightmare"],
  },
  zosima: {
    characterIds: ["zosima", "alexei", "ferapont", "paisiy"],
    imageId: "zosima-cell",
    consequences:
      "Отсутствие ожидаемого чуда испытывает веру Алёши. Спор о теле старца раскрывает также тщеславие и соперничество внутри религиозной общины.",
    relatedIds: ["onion", "stone"],
  },
  onion: {
    characterIds: ["alexei", "grushenka", "rakitin"],
    imageId: "grushenka-lamp",
    consequences:
      "Встреча, задуманная как нравственное падение, становится опытом взаимного сострадания. Малое движение к другому меняет направление вечера.",
    relatedIds: ["zosima", "mokroe"],
  },
  garden: {
    characterIds: ["dmitri", "grigory", "fyodor"],
    imageId: "dmitri-garden",
    consequences:
      "Дмитрий совершает реальное насилие над Григорием. Следствие впоследствии объединяет этот поступок и иное, не совершённое им убийство в одну версию.",
    relatedIds: ["investigation", "trial"],
  },
  mokroe: {
    characterIds: ["dmitri", "grushenka", "trifon"],
    imageId: "dmitri-mokroe",
    consequences:
      "Праздник и признание обрываются приходом следствия. Деньги, поведение и кровавые следы получают значение улик прежде, чем их происхождение становится ясным.",
    relatedIds: ["investigation", "epilogue"],
  },
  investigation: {
    characterIds: [
      "dmitri",
      "mikhail-makarovich",
      "nikolai-parfenovich",
      "ippolit",
    ],
    imageId: "trial",
    consequences:
      "Неумение объяснить происхождение денег укрепляет обвинение. Переживание Дмитрием сна о дитяти не является доказательством вины, но становится нравственным поворотом его собственной истории.",
    relatedIds: ["trial", "epilogue"],
  },
  "ilyusha-bed": {
    characterIds: ["ilyusha", "kolya", "alexei", "snegiryov"],
    imageId: "boys-snegiryov",
    consequences:
      "Возвращение Коли и собаки соединяет детскую обиду с возможностью примирения. Спор о знании и независимости продолжается в комнате больного ребёнка.",
    relatedIds: ["boys", "stone"],
  },
  "smerdyakov-truth": {
    characterIds: ["ivan", "smerdyakov"],
    imageId: "smerdyakov-kitchen",
    consequences:
      "Признание исполнителя не снимает для Ивана вопроса о попустительстве. Читатель получает сведения, которые суд не сможет принять в той же полноте и форме.",
    relatedIds: ["departure", "nightmare", "trial"],
  },
  nightmare: {
    characterIds: ["ivan", "alexei"],
    imageId: "brothers-tavern",
    consequences:
      "Граница собственного голоса и чужого собеседника становится неустойчивой. Весть о смерти Смердякова лишает Ивана возможности привести его живое свидетельство в суд.",
    relatedIds: ["smerdyakov-truth", "trial"],
  },
  trial: {
    characterIds: [
      "dmitri",
      "ivan",
      "alexei",
      "katerina",
      "grushenka",
      "fetyukovich",
      "ippolit",
    ],
    imageId: "trial",
    consequences:
      "Присяжные признают Дмитрия виновным. Разрыв между юридическим приговором и известной читателю историей не отменяет его ответственности за другие поступки.",
    relatedIds: ["investigation", "epilogue"],
  },
  epilogue: {
    characterIds: ["dmitri", "katerina", "grushenka", "alexei"],
    imageId: "dmitri-mokroe",
    consequences:
      "Планы побега остаются планами, а примирение не становится простой отменой прошлого. Роман оставляет будущую жизнь героев открытой.",
    relatedIds: ["trial", "women"],
  },
  stone: {
    characterIds: ["alexei", "kolya", "smurov", "ilyusha", "snegiryov"],
    imageId: "stone-epilogue",
    consequences:
      "Память о мальчике предлагается как общая нравственная опора. Это финал завершённого романа, а не написанная автором биография будущего Алёши.",
    relatedIds: ["boys", "ilyusha-bed", "zosima"],
  },
};
