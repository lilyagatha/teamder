const translate = (key) => {
  const translation = {
    centralAndWestDistrict: "中西區",
    easternDistrict: "東區",
    southernDistrict: "南區",
    wanChaiDistrict: "灣仔區",
    kowloonCityDistrict: "九龍城區",
    kwunTongDistrict: "觀塘區",
    shamShuiPoDistrict: "深水埗區",
    wongTaiSinDistrict: "黃大仙區",
    yauTsimMongDistrict: "油尖旺區",
    islandDistrict: "離島區",
    kwaiTsingDistrict: "葵青區",
    northDistrict: "北區",
    saiKungDistrict: "西貢區",
    shaTinDistrict: "沙田區",
    taiPoDistrict: "大埔區",
    tsuenWanDistrict: "荃灣區",
    tuenMunDistrict: "屯門區",
    yuenLongDistrict: "元朗區",
    M: "男",
    F: "女",
    U: "不顯示",
  };
  return translation[key];
};
