<?php
// https://www.smashingmagazine.com/2021/04/complete-guide-html-email-templates-tools/
function makehtml($data) {
  $_ = function ($val){return $val;};

  $direction = '[' . $data->loading->place . ' => ' . $data->unloading->place . ']';
  $order_date = DateTime::createFromFormat('Y-m-d', $data->loading->date);
  // var_dump($order_date);

  $cargo = <<<END
  <table border="1" cellpadding="2" cellspacing="0" style="margin:0; padding:0; border-collapse: collapse; width: 100%;">
    <caption>
      Груз <span style="font-weight: bold; font-size: large;">{$_($data->cargo->name)}</span>
    </caption>
    <thead>
      <tr>
        <td>Вес, кг</td>
        <td>Объем, м³</td>
        <td>Количество мест</td>
        <td>Температурный режим</td>
        <td>Объявленная стоимость, руб.</td>
        <td>Страховка</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-weight: bold; font-size: large;">{$_($data->cargo->weight)}</td>
        <td style="font-weight: bold; font-size: large;">{$_($data->cargo->volume)}</td>
        <td style="font-weight: bold; font-size: large;">{$_($data->cargo->qty)}</td>
        <td style="font-weight: bold; font-size: large;">{$_($data->cargo->condition)}</td>
        <td style="font-weight: bold; font-size: large;">{$_($data->cargo->value)}</td>
        <td style="font-weight: bold; font-size: large;">{$_($data->cargo->insurance)}</td>
      </tr>
    </tbody>
  </table>
  END;

  $counterAgent = new stdClass();
  foreach (array('consigner', 'consignee', 'payer') as $role) {
    $counterAgent->role = '';
    if ($data->{$role}->{'isPayer'}) {
      $data->payer = $data->{$role};
    }

    if ($data->{$role}->type == 'legal-entity') {
      $counterAgent->{$role} = <<<END
  <table border="1" cellpadding="2" cellspacing="0" style="margin:0; padding:0; border-collapse: collapse; width: 100%;">
    <caption>
      {$_(array('consigner'=>'Грузоотправитель', 'consignee'=>'Грузополучатель', 'payer'=>'Плательщик')[$role])}
      <span style="font-weight: bold; font-size: large;">{$_($data->{$role}->name)}</span>
    </caption>

    <tbody>
      <tr>
        <td>ИНН</td>
        <td>КПП</td>
        <td>ОГРН</td>
        <td>Юридический адрес</td>
      </tr>
      <tr>
        <td style="font-weight: bold; font-size: large;">{$_($data->{$role}->{'INN'})}</td>
        <td style="font-weight: bold; font-size: large;">{$_($data->{$role}->{'KPP'})}</td>
        <td style="font-weight: bold; font-size: large;">{$_($data->{$role}->{'OGRN'})}</td>
        <td style="font-weight: bold; font-size: large;">{$_($data->{$role}->{'address'})}</td>
      </tr>
      {$_(
          ($role == 'payer')
            ? ''
            : '<tr><td colspan="4">Контактное лицо по вопросам передачи груза <span style="font-weight: bold; font-size: large;">'
            . $data->{$role}->{'cargoContactFio'} . ' ' . $data->{$role}->{'cargoContactTel'} . '</span></td></tr>'
      )}
      </tr>
      {$_(
        ($data->{$role}->{'isPayer'})
          ? '<tr><td colspan="4">Контактное лицо по вопросам оплаты <span style="font-weight: bold; font-size: large;">'
          . $data->{$role}->{'payingContactFio'} . ' ' . $data->{$role}->{'payingContactTel'} . '</span></td></tr>'
          : ''
      )}
    </tbody>
    </table>
  END;
    }

    if ($data->{$role}->type == "private-person") {
      $counterAgent->{$role} = <<<END
  <table border="1" cellpadding="2" cellspacing="0" style="margin:0; padding:0; border-collapse: collapse; width: 100%;">
    <caption>
      {$_(array('consigner'=>'Грузоотправитель', 'consignee'=>'Грузополучатель', 'payer'=>'Плательщик')[$role])}
      <span style="font-weight: bold; font-size: large;">
        {$_($data->{$role}->{'name'})} {$_($data->{$role}->{'tel'})}
      </span>
    </caption>
  </table>
  END;
    }
  }

  // var_dump($counterAgent);

  $operationObject = new stdClass();
  foreach(array('loading', 'unloading') as $operation) {
    $operationObject->{$operation} = <<<END
  <table border="1" cellpadding="2" cellspacing="0" style="margin:0; padding:0; border-collapse: collapse; width: 100%;">
    <caption>
      {$_(array('loading' => 'Сдача груза', 'unloading' => 'Получение груза')[$operation])}
    </caption>
    <thead>
      <tr>
        <td>Дата</td>
        <td>Время</td>
        <td>Город</td>
        <td>Способ</td>
        <td>Адрес</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-weight: bold; font-size: large;">{$_($data->{$operation}->{'date'})}</td>
        <td style="font-weight: bold; font-size: large;">{$_($data->{$operation}->{'time'})}</td>
        <td style="font-weight: bold; font-size: large;">{$_($data->{$operation}->{'place'})}</td>
        <td style="font-weight: bold; font-size: large;">{$_(array("$operation-point-terminal" => 'Терминал', "$operation-point-client" => 'Подача машины', "$operation-point-pickup" => 'Передача на трассе')[$data->{$operation}->{'point'}])}</td>
        <td style="font-weight: bold; font-size: large;">{$_($data->{$operation}->{'pointClientAddress'})}</td>
      </tr>
    </tbody>
  </table>
  END;
  };

  // var_dump($operationObject);

  $html = <<<END
  <div class="email" style="max-width: 190mm; font-size: 12pt;">
    <div style="font-size: large; border-bottom: 1px solid black;">
      <div style="float: left;">Заявка на грузоперевозку</div>
      <div style="float: right;">{$_($data->meta->timestamp)}</div>
      <div style="clear: both;"></div>
    </div>

    <div style="padding: 1em 0;">
      Дата отправления: <span style="font-size: large; font-weight: bold;">{$_($order_date->format('Y-m-d'))}</span>
      Направление: <span style="font-size: large; font-weight: bold;">$direction</span>
    </div>

    {$_($counterAgent->{'consigner'})}
    {$_($counterAgent->{'consignee'})}

    {$_($cargo)}

    <table border="1" cellpadding="2" cellspacing="0" style="margin:0; padding:0; border-collapse: collapse; width: 100%; margin-top: 0.5em;">
      <thead>
        <tr>
          <td></td>
          <td style="width: 50%;">Сдача груза</td>
          <td style="width: 50%;">Получение груза</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Дата</td>
          <td style="font-weight: bold; font-size: large;">{$_($data->{'loading'}->{'date'})}</td>
          <td></td>
        </tr>
        <tr>
          <td>Время</td>
          <td style="font-weight: bold; font-size: large;">{$_($data->{'loading'}->{'time'})}</td>
          <td></td>
        </tr>
        <tr>
          <td>Город</td>
          <td style="font-weight: bold; font-size: large;">{$_($data->{'loading'}->{'place'})}</td>
          <td style="font-weight: bold; font-size: large;">{$_($data->{'unloading'}->{'place'})}</td>
        </tr>
        <tr>
          <td>Способ</td>
          <td style="font-weight: bold; font-size: large;">{$_(array(
            'loading-point-terminal' => 'терминал',
            'loading-point-client' => 'подача машины',
            'loading-point-pickup' => 'забрать груз на трассе')[$data->{'loading'}->{'point'}])}
          </td>
          <td style="font-weight: bold; font-size: large;">{$_(array(
            'unloading-point-terminal' => 'терминал',
            'unloading-point-client' => 'подача машины',
            'unloading-point-pickup' => 'передать груз на трассе')[$data->{'unloading'}->{'point'}])}
          </td>
        </tr>
        <tr>
          <td>Адрес</td>
          <td style="font-weight: bold; font-size: large;">
            {$_(
              ($data->{'loading'}->{'point'} == 'loading-point-terminal')
                ? ''
                : $data->{'loading'}->{'pointClientAddress'}
            )}
          </td>
          <td style="font-weight: bold; font-size: large;">
            {$_(
              $data->{'unloading'}->{'point'} == 'unloading-point-terminal'
                ? ''
                : $data->{'unloading'}->{'pointClientAddress'}
            )}
          </td>
        </tr>
      </tbody>
    </table>
    {$_($counterAgent->{'payer'})}
    <p>Форма оплаты: <span style="font-weight: bold; font-size: large;">{$_($data->{'paymentForm'})}</span></p>
    <p>Дополнительная информация: <span style="font-weight: bold; font-size: large;">{$_($data->{'memo'})}</span></p>
    <p>Заявку составил:
      <span style="font-weight: bold; font-size: large;">{$_($data->{'author'}->{'fio'})}</span>,
      тел
      <span style="font-weight: bold; font-size: large;">{$_($data->{'author'}->{'tel'})}</span>,
      email
      <span style="font-weight: bold; font-size: large;">{$_($data->{'author'}->{'email'})}</span></p>
  </div>
  END;

  // var_dump($html);
  return $html;
};
